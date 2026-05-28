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
	constructor(name: string, type: string) {
		super(`A salary component with name "${name}" and type "${type}" already exists.`);
		this.name = 'DuplicateComponentError';
	}
}

export class ComponentNotFoundError extends Error {
	constructor(id: number) {
		super(`Salary component with ID ${id} not found.`);
		this.name = 'ComponentNotFoundError';
	}
}

/**
 * Creates a new Salary Component master entry.
 * Implements business validation rules (trimming and duplicate checks).
 */
export async function createComponent(dto: CreateSalaryComponentDto) {
	const trimmedName = dto.component_name.trim();

	// Business validation: check for duplicates
	const existing = await repository.findByNameAndType(trimmedName, dto.component_type);
	if (existing) {
		throw new DuplicateComponentError(trimmedName, dto.component_type);
	}

	return repository.create({
		...dto,
		component_name: trimmedName
	});
}

/**
 * Updates an existing Salary Component master entry.
 * Implements business validation rules (trimming and duplicate checks).
 */
export async function updateComponent(id: number, dto: UpdateSalaryComponentDto) {
	// First check if it exists
	const current = await repository.findById(id);
	if (!current) {
		throw new ComponentNotFoundError(id);
	}

	const updatedName = dto.component_name !== undefined ? dto.component_name.trim() : current.component_name;
	const updatedType = dto.component_type !== undefined ? dto.component_type : current.component_type;

	// Business validation: check for duplicates if name or type is changing
	if (
		dto.component_name !== undefined ||
		dto.component_type !== undefined
	) {
		const existing = await repository.findByNameAndType(updatedName, updatedType);
		if (existing && existing.component_id !== id) {
			throw new DuplicateComponentError(updatedName, updatedType);
		}
	}

	return repository.update(id, {
		...dto,
		component_name: dto.component_name !== undefined ? updatedName : undefined
	});
}

/**
 * Retrieves a single Salary Component by ID.
 */
export async function getComponentById(id: number) {
	const component = await repository.findById(id);
	if (!component) {
		throw new ComponentNotFoundError(id);
	}
	return component;
}

/**
 * Retrieves lists of Salary Components with filters, sorting, and pagination.
 */
export async function getComponents(filters: SalaryComponentFilters) {
	// Pre-process filters
	const processedFilters: SalaryComponentFilters = {
		...filters,
		search: filters.search?.trim(),
		page: filters.page ? Number(filters.page) : 1,
		pageSize: filters.pageSize ? Number(filters.pageSize) : 10
	};

	return repository.findMany(processedFilters);
}

/**
 * Toggles or sets the status of a Salary Component (soft delete/deactivation).
 */
export async function toggleComponentStatus(id: number, status: 'active' | 'inactive') {
	const current = await repository.findById(id);
	if (!current) {
		throw new ComponentNotFoundError(id);
	}

	return repository.update(id, { status });
}
