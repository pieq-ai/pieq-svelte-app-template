import * as repository from '$lib/server/repositories/salary-component.repository.js';
import type {
	CreateSalaryComponentDto,
	UpdateSalaryComponentDto,
	SalaryComponentFilters
} from '$lib/types/salary-component.js';

export class BusinessValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BusinessValidationError';
	}
}

export class DuplicateComponentError extends BusinessValidationError {
	constructor() {
		super(`Salary component name already exists.`);
		this.name = 'DuplicateComponentError';
	}
}

export class ComponentNotFoundError extends Error {
	constructor(cuid: string) {
		super(`Salary component with ID ${cuid} not found.`);
		this.name = 'ComponentNotFoundError';
	}
}

/**
 * Creates a new Salary Component master entry.
 * Implements business validation rules (trimming and duplicate checks).
 */
export async function createComponent(dto: CreateSalaryComponentDto) {
	const trimmedName = dto.component_name.trim();

	// Business validation: check for duplicates (name must be globally unique)
	const existing = await repository.findByName(trimmedName);
	if (existing) {
		throw new DuplicateComponentError();
	}

	return repository.create({
		...dto,
		component_name: trimmedName
	});
}

/**
 * Updates an existing Salary Component master entry.
 * Implements business validation rules (trimming and duplicate checks).
 * @param cuid - The externally-exposed cuid of the salary component
 */
export async function updateComponent(cuid: string, dto: UpdateSalaryComponentDto) {
	// First check if it exists
	const current = await repository.findByCuid(cuid);
	if (!current) {
		throw new ComponentNotFoundError(cuid);
	}

	const updatedName =
		dto.component_name !== undefined ? dto.component_name.trim() : current.component_name;

	// Business validation: check for duplicates if name is changing
	if (dto.component_name !== undefined) {
		const existing = await repository.findByName(updatedName);
		if (existing && existing.cuid !== cuid) {
			throw new DuplicateComponentError();
		}
	}

	return repository.update(cuid, {
		...dto,
		component_name: dto.component_name !== undefined ? updatedName : undefined
	});
}

/**
 * Retrieves a single Salary Component by its external cuid.
 */
export async function getComponentByCuid(cuid: string) {
	const component = await repository.findByCuid(cuid);
	if (!component) {
		throw new ComponentNotFoundError(cuid);
	}
	return component;
}

/**
 * Retrieves lists of Salary Components with filters, sorting, and pagination.
 */
export async function getComponents(filters: SalaryComponentFilters) {
	// Pre-process filters — only coerce page/pageSize when explicitly provided
	const processedFilters: SalaryComponentFilters = {
		...filters,
		search: filters.search?.trim(),
		page: filters.page !== undefined ? Number(filters.page) : undefined,
		pageSize: filters.pageSize !== undefined ? Number(filters.pageSize) : undefined
	};

	return repository.findMany(processedFilters);
}

/**
 * Toggles or sets the active state of a Salary Component (soft delete/deactivation).
 * @param cuid - The externally-exposed cuid of the salary component
 */
export async function toggleComponentStatus(
	cuid: string,
	is_active: boolean,
	updated_by?: string | null
) {
	const current = await repository.findByCuid(cuid);
	if (!current) {
		throw new ComponentNotFoundError(cuid);
	}

	return repository.update(cuid, { is_active, updated_by });
}

/**
 * Returns aggregate counts for the stats dashboard cards.
 * No row data is fetched — backed by three parallel COUNT queries.
 */
export async function getStats() {
	return repository.getStats();
}
