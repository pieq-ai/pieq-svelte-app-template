import * as dao from '$lib/server/dao/salary-structure.dao.js';
import * as salaryComponentDao from '$lib/server/dao/salary-component.dao.js';
import { findEmployeeByCuid } from '$lib/server/providers/employee.provider.js';
import { serializeSalaryStructure } from '$lib/server/serializers/salary-structure.serializer.js';
import { validateEffectiveDateRange } from '$lib/validators/salary-structure.js';
import type {
	CreateSalaryStructureDto,
	UpdateSalaryStructureDto,
	CreateRevisionDto
} from '$lib/types/salary-structure.js';
import { db } from '$lib/server/db.js';
import * as auditService from '$lib/server/services/audit.service.js';

export class ConfirmationRequiredError extends Error {
	constructor() {
		super('Confirmation is required to adjust timeline.');
		this.name = 'ConfirmationRequiredError';
	}
}
export class BusinessValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BusinessValidationError';
	}
}

export class SalaryStructureNotFoundError extends Error {
	constructor(cuid: string) {
		super(`Salary structure with ID ${cuid} not found.`);
		this.name = 'SalaryStructureNotFoundError';
	}
}

export class InvalidEmployeeError extends BusinessValidationError {
	constructor(cuid: string) {
		super(`Employee with ID "${cuid}" does not exist.`);
		this.name = 'InvalidEmployeeError';
	}
}

export class InvalidSalaryComponentError extends BusinessValidationError {
	constructor(cuid: string) {
		super(`Salary component with ID "${cuid}" does not exist or is inactive.`);
		this.name = 'InvalidSalaryComponentError';
	}
}

export class DuplicateComponentInStructureError extends BusinessValidationError {
	constructor(cuid: string) {
		super(`Duplicate salary component in structure: "${cuid}".`);
		this.name = 'DuplicateComponentInStructureError';
	}
}

export class ActiveStructureExistsError extends BusinessValidationError {
	constructor(employee_cuid: string) {
		super(
			`Employee "${employee_cuid}" already has an Active Salary Structure. Use Create Revision instead.`
		);
		this.name = 'ActiveStructureExistsError';
	}
}

export class SourceStructureNotActiveError extends BusinessValidationError {
	constructor() {
		super('Cannot create a revision from an Inactive Salary Structure.');
		this.name = 'SourceStructureNotActiveError';
	}
}

/** Validate that an employee exists in the DB. */
async function assertEmployeeExists(employee_cuid: string) {
	if (!(await findEmployeeByCuid(employee_cuid))) {
		throw new InvalidEmployeeError(employee_cuid);
	}
}

/**
 * Validate that each salary component exists and is active. Also checks for duplicates.
 * Returns an array of { salary_component_cuid, component_name } for snapshot population.
 */
async function assertComponentsValid(
	items: Array<{ salary_component_cuid: string; amount: number }>
): Promise<Map<string, string>> {
	const seen = new Set<string>();
	const nameMap = new Map<string, string>();

	for (const item of items) {
		const cuid = item.salary_component_cuid;
		if (seen.has(cuid)) {
			throw new DuplicateComponentInStructureError(cuid);
		}
		seen.add(cuid);

		const component = await salaryComponentDao.findByCuid(cuid);
		if (!component || !component.status) {
			throw new InvalidSalaryComponentError(cuid);
		}
		nameMap.set(cuid, component.name);
	}

	return nameMap;
}

/**
 * Compute `effective_to` for the previous structure when a revision is created.
 * Returns one day before the new effective_from as an ISO date string (YYYY-MM-DD).
 */
function previousEffectiveTo(newEffectiveFrom: string): string {
	const [year, month, day] = newEffectiveFrom.split('-').map(Number);
	const d = new Date(Date.UTC(year, month - 1, day));
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().split('T')[0];
}

interface TimelineStructure {
	cuid?: string;
	employee_cuid: string;
	effective_from: string;
	effective_to: string | null;
	status: boolean;
}

export async function processTimelineAdjustments(
	employeeCuid: string,
	targetCuid: string | null,
	proposedFrom: string,
	proposedTo: string | null,
	confirmAdjustment: boolean
): Promise<{
	status: 'success' | 'confirm_required' | 'invalid';
	error?: string;
	updates?: Array<{ cuid: string; effective_from?: string; effective_to: string | null; status: boolean }>;
}> {
	const existingRaw = await dao.findByEmployeeCuid(employeeCuid);
	
	const existing: TimelineStructure[] = existingRaw.map(s => ({
		cuid: s.cuid,
		employee_cuid: s.employee_cuid,
		effective_from: s.effective_from.toISOString().split('T')[0],
		effective_to: s.effective_to ? s.effective_to.toISOString().split('T')[0] : null,
		status: s.status
	}));

	let proposedList: TimelineStructure[];
	if (targetCuid) {
		proposedList = existing.map(s => {
			if (s.cuid === targetCuid) {
				return {
					...s,
					effective_from: proposedFrom,
					effective_to: proposedTo
				};
			}
			return s;
		});
	} else {
		proposedList = [
			...existing,
			{
				employee_cuid: employeeCuid,
				effective_from: proposedFrom,
				effective_to: proposedTo,
				status: true
			}
		];
	}

	// Sort initially by effective_from to find the target structure's position
	proposedList.sort((a, b) => a.effective_from.localeCompare(b.effective_from));

	// If target structure's effective_to was updated to a date, adjust the next structure's effective_from
	if (targetCuid) {
		const idx = proposedList.findIndex(s => s.cuid === targetCuid);
		if (idx !== -1) {
			const target = proposedList[idx];
			if (target.effective_to !== null) {
				if (idx < proposedList.length - 1) {
					// Adjust next structure's effective_from
					const next = proposedList[idx + 1];
					const [year, month, day] = target.effective_to.split('-').map(Number);
					const nextFromDate = new Date(Date.UTC(year, month - 1, day));
					nextFromDate.setUTCDate(nextFromDate.getUTCDate() + 1);
					next.effective_from = nextFromDate.toISOString().split('T')[0];
				}
			} else {
				// if proposedTo is null, but there is a next structure, it is invalid
				if (idx < proposedList.length - 1) {
					return {
						status: 'invalid',
						error: 'Only the last salary structure in the timeline can have an open-ended Effective To date.'
					};
				}
			}
		}
	} else {
		// For new structure creation, if proposedTo is null but it is inserted before another structure
		const idx = proposedList.findIndex(s => !s.cuid);
		if (idx !== -1) {
			const target = proposedList[idx];
			if (target.effective_to !== null) {
				if (idx < proposedList.length - 1) {
					const next = proposedList[idx + 1];
					const [year, month, day] = target.effective_to.split('-').map(Number);
					const nextFromDate = new Date(Date.UTC(year, month - 1, day));
					nextFromDate.setUTCDate(nextFromDate.getUTCDate() + 1);
					next.effective_from = nextFromDate.toISOString().split('T')[0];
				}
			}
		}
	}

	// Re-sort after potential next structure start date adjustments
	proposedList.sort((a, b) => a.effective_from.localeCompare(b.effective_from));

	// Check for duplicate effective_from
	for (let i = 0; i < proposedList.length - 1; i++) {
		if (proposedList[i].effective_from === proposedList[i + 1].effective_from) {
			return {
				status: 'invalid',
				error: 'Duplicate structures with the same effective from date are not allowed.'
			};
		}
	}

	const calculatedList: TimelineStructure[] = [];
	for (let i = 0; i < proposedList.length; i++) {
		const current = proposedList[i];
		const next = proposedList[i + 1];

		let targetTo: string | null;
		let targetStatus: boolean;

		if (next) {
			const [year, month, day] = next.effective_from.split('-').map(Number);
			const nextDate = new Date(Date.UTC(year, month - 1, day));
			nextDate.setUTCDate(nextDate.getUTCDate() - 1);
			targetTo = nextDate.toISOString().split('T')[0];
			targetStatus = false;

			if (targetTo < current.effective_from) {
				return {
					status: 'invalid',
					error: `Timeline adjustment results in an invalid date range for a salary structure starting on ${current.effective_from}.`
				};
			}
		} else {
			targetTo = current.effective_to;
			targetStatus = true;

			if (targetTo !== null && targetTo < current.effective_from) {
				return {
					status: 'invalid',
					error: `Timeline adjustment results in an invalid date range for a salary structure starting on ${current.effective_from}.`
				};
			}
		}

		calculatedList.push({
			...current,
			effective_to: targetTo,
			status: targetStatus
		});
	}

	const updates: Array<{ cuid: string; effective_from?: string; effective_to: string | null; status: boolean }> = [];
	let hasOverlapOrAdjustment = false;

	for (const calc of calculatedList) {
		if (!calc.cuid) {
			continue;
		}
		
		const original = existing.find(o => o.cuid === calc.cuid);
		if (original) {
			const fromChanged = original.effective_from !== calc.effective_from;
			const dateChanged = original.effective_to !== calc.effective_to;
			const statusChanged = original.status !== calc.status;
			
			if (fromChanged || dateChanged || statusChanged) {
				hasOverlapOrAdjustment = true;
				updates.push({
					cuid: calc.cuid,
					...(fromChanged && { effective_from: calc.effective_from }),
					effective_to: calc.effective_to,
					status: calc.status
				});
			}
		}
	}
	
	if (hasOverlapOrAdjustment) {
		let requiresConfirmation = false;
		for (const update of updates) {
			const original = existing.find((o) => o.cuid === update.cuid);
			if (original && original.effective_to !== null) {
				requiresConfirmation = true;
				break;
			}
		}

		if (requiresConfirmation && !confirmAdjustment) {
			return {
				status: 'confirm_required',
				updates
			};
		}
	}

	return {
		status: 'success',
		updates
	};
}

/**
 * Create the first Salary Structure for an employee.
 * Validates employee existence and confirms no Active structure already exists.
 * All component cuids are validated before writing to DB.
 */
export async function createStructure(dto: CreateSalaryStructureDto) {
	await assertEmployeeExists(dto.employee_cuid);

	const timeline = await processTimelineAdjustments(
		dto.employee_cuid,
		null,
		dto.effective_from,
		dto.effective_to || null,
		dto.confirmAdjustment ?? false
	);

	if (timeline.status === 'invalid') {
		throw new BusinessValidationError(timeline.error!);
	}

	if (timeline.status === 'confirm_required') {
		throw new ConfirmationRequiredError();
	}

	const nameMap = await assertComponentsValid(dto.components);

	return db.$transaction(async (tx) => {
		for (const update of timeline.updates || []) {
			await tx.salaryStructure.update({
				where: { cuid: update.cuid },
				data: {
					...(update.effective_from && { effective_from: new Date(update.effective_from) }),
					effective_to: update.effective_to ? new Date(update.effective_to) : null,
					status: update.status
				}
			});
		}

		const existingRaw = await tx.salaryStructure.findMany({
			where: { employee_cuid: dto.employee_cuid }
		});
		const all = [
			...existingRaw.map(e => ({ cuid: e.cuid, from: e.effective_from.toISOString().split('T')[0] })),
			{ cuid: 'new', from: dto.effective_from }
		].sort((a, b) => a.from.localeCompare(b.from));

		const index = all.findIndex(a => a.cuid === 'new');
		const next = all[index + 1];

		let targetTo: Date | null;
		let targetStatus: boolean;

		if (next) {
			const [year, month, day] = next.from.split('-').map(Number);
			const nextDate = new Date(Date.UTC(year, month - 1, day));
			nextDate.setUTCDate(nextDate.getUTCDate() - 1);
			targetTo = nextDate;
			targetStatus = false;
		} else {
			targetTo = dto.effective_to ? new Date(dto.effective_to) : null;
			targetStatus = true;
		}

		const structure = await tx.salaryStructure.create({
			data: {
				employee_cuid: dto.employee_cuid,
				effective_from: new Date(dto.effective_from),
				effective_to: targetTo,
				status: targetStatus,
				created_by: dto.created_by ?? null
			}
		});

		const createdItems = await Promise.all(
			dto.components.map((item) =>
				tx.salaryStructureItem.create({
					data: {
						salary_structure_cuid: structure.cuid,
						salary_component_cuid: item.salary_component_cuid,
						component_name_snapshot: nameMap.get(item.salary_component_cuid) ?? '',
						amount: item.amount,
						created_by: dto.created_by ?? null
					}
				})
			)
		);

		await auditService.log({
			entity_name: 'SalaryStructure',
			entity_cuid: structure.cuid,
			action_type: 'create',
			status: 'SUCCESS',
		}, tx);

		const typeMap = await getComponentTypeMap(createdItems.map((i: { salary_component_cuid: string }) => i.salary_component_cuid));
		return serializeSalaryStructure(structure, createdItems, typeMap);
	});
}

/**
 * Create a new Salary Revision from an existing Active structure.
 *
 * Flow:
 * 1. Verify source structure exists and is Active.
 * 2. Validate all new components.
 * 3. Close the previous structure: status=Inactive, effective_to = newFrom - 1 day.
 * 4. Create the new structure with status=Active.
 * 5. Create items with component_name_snapshot.
 */
export async function createRevision(sourceCuid: string, dto: CreateRevisionDto) {
	// Verify source structure
	const source = await dao.findByCuid(sourceCuid);
	if (!source) {
		throw new SalaryStructureNotFoundError(sourceCuid);
	}
	if (!source.status) {
		throw new SourceStructureNotActiveError();
	}

	const sourceFrom = source.effective_from.toISOString().split('T')[0];
	const sourceTo = source.effective_to ? source.effective_to.toISOString().split('T')[0] : null;

	const isOverlap = sourceTo !== null
		? dto.effective_from <= sourceTo
		: dto.effective_from <= sourceFrom;

	if (isOverlap) {
		throw new BusinessValidationError("New salary structures must start after the current active structure's effective period.");
	}

	// Validate all components and capture name snapshots
	const nameMap = await assertComponentsValid(dto.components);

	return db.$transaction(async (tx) => {
		// Close the previous Active structure
		await dao.update(sourceCuid, {
			status: false,
			effective_to: previousEffectiveTo(dto.effective_from),
			updated_by: dto.created_by ?? null
		});

		// Create the new (revision) structure
		const newStructure = await dao.create({
			employee_cuid: source.employee_cuid,
			effective_from: dto.effective_from,
			effective_to: null,
			status: true,
			created_by: dto.created_by ?? null
		});

		// Create items with snapshots
		const items = await dao.createItems(
			newStructure.cuid,
			dto.components.map((item) => ({
				salary_component_cuid: item.salary_component_cuid,
				component_name_snapshot: nameMap.get(item.salary_component_cuid) ?? '',
				amount: item.amount,
				created_by: dto.created_by ?? null
			}))
		);

		await auditService.log({
			entity_name: 'SalaryStructure',
			entity_cuid: newStructure.cuid,
			action_type: 'revision',
			status: 'SUCCESS',
		});

		const typeMap = await getComponentTypeMap(items.map((i: { salary_component_cuid: string }) => i.salary_component_cuid));
		return serializeSalaryStructure(newStructure, items, typeMap);
	});
}

/**
 * Update an existing Salary Structure (internal/administrative use).
 * Does NOT perform the revision flow â€” use createRevision for salary changes.
 */
export async function updateStructure(cuid: string, dto: UpdateSalaryStructureDto) {
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new SalaryStructureNotFoundError(cuid);
	}

	const proposedFrom = dto.effective_from !== undefined ? dto.effective_from : current.effective_from.toISOString().split('T')[0];
	const proposedTo = dto.effective_to !== undefined ? dto.effective_to : (current.effective_to ? current.effective_to.toISOString().split('T')[0] : null);

	if (proposedFrom && proposedTo) {
		const rangeError = validateEffectiveDateRange(proposedFrom, proposedTo);
		if (rangeError) {
			throw new BusinessValidationError(rangeError);
		}
	}

	const employeeCuid = dto.employee_cuid !== undefined ? dto.employee_cuid : current.employee_cuid;

	const timeline = await processTimelineAdjustments(
		employeeCuid,
		cuid,
		proposedFrom,
		proposedTo,
		dto.confirmAdjustment ?? false
	);

	if (timeline.status === 'invalid') {
		throw new BusinessValidationError(timeline.error!);
	}

	if (timeline.status === 'confirm_required') {
		throw new ConfirmationRequiredError();
	}

	if (dto.employee_cuid !== undefined) {
		await assertEmployeeExists(dto.employee_cuid);
	}

	let nameMap: Map<string, string> | undefined;
	if (dto.components !== undefined) {
		nameMap = await assertComponentsValid(dto.components);
	}

	return db.$transaction(async (tx) => {
		for (const update of timeline.updates || []) {
			await tx.salaryStructure.update({
				where: { cuid: update.cuid },
				data: {
					...(update.effective_from && { effective_from: new Date(update.effective_from) }),
					effective_to: update.effective_to ? new Date(update.effective_to) : null,
					status: update.status
				}
			});
		}

		const existingRaw = await tx.salaryStructure.findMany({
			where: { employee_cuid: employeeCuid }
		});
		const all = existingRaw.map(e => {
			if (e.cuid === cuid) {
				return { cuid: e.cuid, from: proposedFrom };
			}
			return { cuid: e.cuid, from: e.effective_from.toISOString().split('T')[0] };
		}).sort((a, b) => a.from.localeCompare(b.from));

		const index = all.findIndex(a => a.cuid === cuid);
		const next = all[index + 1];

		let targetTo: Date | null;
		let targetStatus: boolean;

		if (next) {
			const [year, month, day] = next.from.split('-').map(Number);
			const nextDate = new Date(Date.UTC(year, month - 1, day));
			nextDate.setUTCDate(nextDate.getUTCDate() - 1);
			targetTo = nextDate;
			targetStatus = false;
		} else {
			targetTo = proposedTo ? new Date(proposedTo) : null;
			targetStatus = true;
		}

		const { components, confirmAdjustment, ...structureFields } = dto;
		const updated = await tx.salaryStructure.update({
			where: { cuid },
			data: {
				...(structureFields.employee_cuid !== undefined && { employee_cuid: structureFields.employee_cuid }),
				effective_from: new Date(proposedFrom),
				effective_to: targetTo,
				status: targetStatus,
				updated_by: structureFields.updated_by ?? null
			}
		});

		await auditService.logUpdate({
			entityName: 'SalaryStructure',
			entityCuid: cuid,
			oldRecord: current,
			newRecord: updated
		}, tx);

		if (dto.components !== undefined && nameMap) {
			await tx.salaryStructureItem.deleteMany({
				where: { salary_structure_cuid: cuid }
			});
			const createdItems = await Promise.all(
				dto.components.map((item) =>
					tx.salaryStructureItem.create({
						data: {
							salary_structure_cuid: cuid,
							salary_component_cuid: item.salary_component_cuid,
							component_name_snapshot: nameMap!.get(item.salary_component_cuid) ?? '',
							amount: item.amount,
							created_by: dto.updated_by ?? null
						}
					})
				)
			);
			const typeMap = await getComponentTypeMap(createdItems.map((i: { salary_component_cuid: string }) => i.salary_component_cuid));
			return serializeSalaryStructure(updated, createdItems, typeMap);
		}

		const existingItems = await tx.salaryStructureItem.findMany({
			where: { salary_structure_cuid: cuid },
			orderBy: { cuid: 'asc' }
		});
		const typeMap = await getComponentTypeMap(existingItems.map((i: { salary_component_cuid: string }) => i.salary_component_cuid));
		return serializeSalaryStructure(updated, existingItems, typeMap);
	});
}

/** Fetch component types for a set of component CUIDs for serialization. */
async function getComponentTypeMap(componentCuids: string[]): Promise<Map<string, string>> {
	if (componentCuids.length === 0) return new Map();
	const uniqueCuids = Array.from(new Set(componentCuids));
	const components = (await db.salaryComponent?.findMany({
		where: { cuid: { in: uniqueCuids } },
		select: { cuid: true, type: true }
	})) || [];
	return new Map(components.map((c) => [c.cuid, c.type]));
}

/**
 * Retrieve a single Salary Structure by its external cuid, with items.
 */
export async function getStructureByCuid(cuid: string) {
	const structure = await dao.findByCuid(cuid);
	if (!structure) {
		throw new SalaryStructureNotFoundError(cuid);
	}
	const items = await dao.findItemsByStructureCuid(cuid);
	const typeMap = await getComponentTypeMap(items.map((i: { salary_component_cuid: string }) => i.salary_component_cuid));
	return serializeSalaryStructure(structure, items, typeMap);
}

/**
 * Retrieve all Salary Structures with their items.
 * Multiple rows per employee are expected (one per revision).
 */
export async function getStructures() {
	const structures = await dao.findMany();

	if (structures.length === 0) {
		return [];
	}

	// Batch-fetch all items in one query (avoids N+1)
	const allCuids = structures.map((s) => s.cuid);
	const allItems = await dao.findItemsByStructureCuids(allCuids);
	const typeMap = await getComponentTypeMap(allItems.map((i: { salary_component_cuid: string }) => i.salary_component_cuid));

	// Group items by structure cuid
	const itemsByStructure = new Map<string, typeof allItems>();
	for (const item of allItems) {
		const list = itemsByStructure.get(item.salary_structure_cuid) ?? [];
		list.push(item);
		itemsByStructure.set(item.salary_structure_cuid, list);
	}

	return structures.map((structure) =>
		serializeSalaryStructure(structure, itemsByStructure.get(structure.cuid) ?? [], typeMap)
	);
}

/**
 * Deactivate a Salary Structure (soft delete â€” sets status to false).
 */
export async function deactivateStructure(cuid: string, updated_by?: string | null) {
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new SalaryStructureNotFoundError(cuid);
	}

	const updated = await dao.update(cuid, { status: false, updated_by });
	const items = await dao.findItemsByStructureCuid(cuid);
	const typeMap = await getComponentTypeMap(items.map((i: { salary_component_cuid: string }) => i.salary_component_cuid));
	return serializeSalaryStructure(updated, items, typeMap);
}
