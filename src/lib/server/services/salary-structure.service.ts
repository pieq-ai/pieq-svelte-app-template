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

// ─── Custom error classes ─────────────────────────────────────────────────────

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

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Validate that an employee exists in the provider. */
function assertEmployeeExists(employee_cuid: string) {
	if (!findEmployeeByCuid(employee_cuid)) {
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
		nameMap.set(cuid, component.component_name);
	}

	return nameMap;
}

/**
 * Compute `effective_to` for the previous structure when a revision is created.
 * Returns one day before the new effective_from as an ISO date string (YYYY-MM-DD).
 */
function previousEffectiveTo(newEffectiveFrom: string): string {
	const d = new Date(newEffectiveFrom);
	d.setDate(d.getDate() - 1);
	return d.toISOString().split('T')[0];
}

// ─── Service operations ───────────────────────────────────────────────────────

/**
 * Create the first Salary Structure for an employee.
 * Validates employee existence and confirms no Active structure already exists.
 * All component cuids are validated before writing to DB.
 */
export async function createStructure(dto: CreateSalaryStructureDto) {
	// Validate employee
	assertEmployeeExists(dto.employee_cuid);

	// Enforce: only one Active structure per employee — Add Structure is blocked if one exists
	const existingActive = await dao.findActiveByEmployeeCuid(dto.employee_cuid);
	if (existingActive) {
		throw new ActiveStructureExistsError(dto.employee_cuid);
	}

	// Validate all components and capture name snapshots
	const nameMap = await assertComponentsValid(dto.components);

	// Create the structure record (always Active when created via Add Structure)
	const structure = await dao.create({ ...dto, status: true });

	// Create all item rows with name snapshots
	const items = await dao.createItems(
		structure.cuid,
		dto.components.map((item) => ({
			salary_component_cuid: item.salary_component_cuid,
			component_name_snapshot: nameMap.get(item.salary_component_cuid) ?? '',
			amount: item.amount,
			created_by: dto.created_by ?? null
		}))
	);

	return serializeSalaryStructure(structure, items);
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

	// Validate all components and capture name snapshots
	const nameMap = await assertComponentsValid(dto.components);

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

	return serializeSalaryStructure(newStructure, items);
}

/**
 * Update an existing Salary Structure (internal/administrative use).
 * Does NOT perform the revision flow — use createRevision for salary changes.
 */
export async function updateStructure(cuid: string, dto: UpdateSalaryStructureDto) {
	// Check existence
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new SalaryStructureNotFoundError(cuid);
	}

	// Validate date range and overlaps
	const proposedFrom = dto.effective_from !== undefined ? dto.effective_from : current.effective_from.toISOString().split('T')[0];
	const proposedTo = dto.effective_to !== undefined ? dto.effective_to : (current.effective_to ? current.effective_to.toISOString().split('T')[0] : null);

	if (proposedFrom && proposedTo) {
		const rangeError = validateEffectiveDateRange(proposedFrom, proposedTo);
		if (rangeError) {
			throw new BusinessValidationError(rangeError);
		}
	}

	// Check overlaps with other structures for this employee
	const employeeCuid = dto.employee_cuid !== undefined ? dto.employee_cuid : current.employee_cuid;
	const allStructures = await dao.findByEmployeeCuid(employeeCuid);
	const otherStructures = allStructures.filter((s) => s.cuid !== cuid);

	for (const other of otherStructures) {
		const otherFrom = other.effective_from.toISOString().split('T')[0];
		const otherTo = other.effective_to ? other.effective_to.toISOString().split('T')[0] : null;

		const cond1 = otherTo === null || proposedFrom <= otherTo;
		const cond2 = proposedTo === null || otherFrom <= proposedTo;
		if (cond1 && cond2) {
			throw new BusinessValidationError(
				`The date range overlaps with another salary structure for this employee (${otherFrom} to ${otherTo ?? 'ongoing'}).`
			);
		}
	}

	// Validate employee if changing
	if (dto.employee_cuid !== undefined) {
		assertEmployeeExists(dto.employee_cuid);
	}

	// Validate components if items are being updated
	let nameMap: Map<string, string> | undefined;
	if (dto.components !== undefined) {
		nameMap = await assertComponentsValid(dto.components);
	}

	// Update structure fields
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { components, ...structureFields } = dto;
	const updated = await dao.update(cuid, structureFields);

	// Replace items if provided
	if (dto.components !== undefined && nameMap) {
		await dao.deleteItemsByStructureCuid(cuid);
		const createdItems = await dao.createItems(
			cuid,
			dto.components.map((item) => ({
				salary_component_cuid: item.salary_component_cuid,
				component_name_snapshot: nameMap!.get(item.salary_component_cuid) ?? '',
				amount: item.amount,
				created_by: dto.updated_by ?? null
			}))
		);
		return serializeSalaryStructure(updated, createdItems);
	}

	// Return with existing items (no component changes)
	const existingItems = await dao.findItemsByStructureCuid(cuid);
	return serializeSalaryStructure(updated, existingItems);
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
	return serializeSalaryStructure(structure, items);
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

	// Group items by structure cuid
	const itemsByStructure = new Map<string, typeof allItems>();
	for (const item of allItems) {
		const list = itemsByStructure.get(item.salary_structure_cuid) ?? [];
		list.push(item);
		itemsByStructure.set(item.salary_structure_cuid, list);
	}

	return structures.map((structure) =>
		serializeSalaryStructure(structure, itemsByStructure.get(structure.cuid) ?? [])
	);
}

/**
 * Deactivate a Salary Structure (soft delete — sets status to false).
 */
export async function deactivateStructure(cuid: string, updated_by?: string | null) {
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new SalaryStructureNotFoundError(cuid);
	}

	const updated = await dao.update(cuid, { status: false, updated_by });
	const items = await dao.findItemsByStructureCuid(cuid);
	return serializeSalaryStructure(updated, items);
}
