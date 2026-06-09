import * as dao from '$lib/server/dao/salary-structure.dao.js';
import * as salaryComponentDao from '$lib/server/dao/salary-component.dao.js';
import { findEmployeeByCuid } from '$lib/server/providers/employee.provider.js';
import { serializeSalaryStructure } from '$lib/server/serializers/salary-structure.serializer.js';
import type {
	CreateSalaryStructureDto,
	UpdateSalaryStructureDto
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Validate that an employee exists in the provider. */
function assertEmployeeExists(employee_cuid: string) {
	if (!findEmployeeByCuid(employee_cuid)) {
		throw new InvalidEmployeeError(employee_cuid);
	}
}

/** Validate that each salary component exists and is active. Also checks for duplicates. */
async function assertComponentsValid(
	items: Array<{ salary_component_cuid: string; amount: number }>
) {
	const seen = new Set<string>();
	for (const item of items) {
		const cuid = item.salary_component_cuid;
		if (seen.has(cuid)) {
			throw new DuplicateComponentInStructureError(cuid);
		}
		seen.add(cuid);

		const component = await salaryComponentDao.findByCuid(cuid);
		if (!component || !component.is_active) {
			throw new InvalidSalaryComponentError(cuid);
		}
	}
}

// ─── Service operations ───────────────────────────────────────────────────────

/**
 * Create a new Salary Structure with its component items.
 * Validates employee existence and all component cuids before writing to DB.
 */
export async function createStructure(dto: CreateSalaryStructureDto) {
	// Validate employee
	assertEmployeeExists(dto.employee_cuid);

	// Validate all components
	await assertComponentsValid(dto.components);

	// Create the structure record
	const structure = await dao.create(dto);

	// Create all item rows
	const items = await dao.createItems(
		structure.cuid,
		dto.components.map((item) => ({
			salary_component_cuid: item.salary_component_cuid,
			amount: item.amount,
			created_by: dto.created_by ?? null
		}))
	);

	return serializeSalaryStructure(structure, items);
}

/**
 * Update an existing Salary Structure.
 * If `items` is provided, existing items are replaced entirely.
 */
export async function updateStructure(cuid: string, dto: UpdateSalaryStructureDto) {
	// Check existence
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new SalaryStructureNotFoundError(cuid);
	}

	// Validate employee if changing
	if (dto.employee_cuid !== undefined) {
		assertEmployeeExists(dto.employee_cuid);
	}

	// Validate components if items are being updated
	if (dto.components !== undefined) {
		await assertComponentsValid(dto.components);
	}

	// Update structure fields
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { components, ...structureFields } = dto;
	const updated = await dao.update(cuid, structureFields);

	// Replace items if provided
	if (dto.components !== undefined) {
		await dao.deleteItemsByStructureCuid(cuid);
		const createdItems = await dao.createItems(
			cuid,
			dto.components.map((item) => ({
				salary_component_cuid: item.salary_component_cuid,
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
 * Search and sorting are handled client-side.
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
 * Deactivate a Salary Structure (soft delete — sets is_active to false).
 */
export async function deactivateStructure(cuid: string, updated_by?: string | null) {
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new SalaryStructureNotFoundError(cuid);
	}

	const updated = await dao.update(cuid, { is_active: false, updated_by });
	const items = await dao.findItemsByStructureCuid(cuid);
	return serializeSalaryStructure(updated, items);
}
