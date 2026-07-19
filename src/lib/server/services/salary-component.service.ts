import * as dao from '$lib/server/dao/salary-component.dao.js';
import type {
	CreateSalaryComponentDto,
	UpdateSalaryComponentDto
} from '$lib/types/salary-component.js';
import * as auditService from '$lib/server/services/audit.service.js';

export class BusinessValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BusinessValidationError';
	}
}

export class DuplicateComponentError extends BusinessValidationError {
	constructor(_name?: string) {
		super('Salary component already exists');
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
	const trimmedName = dto.name.trim();

	// Business validation: check for duplicates (name must be globally unique)
	const existing = await dao.findByName(trimmedName);
	if (existing) {
		throw new DuplicateComponentError(trimmedName);
	}

	const newComponent = await dao.create({
		...dto,
		name: trimmedName
	});

	await auditService.log({
		entity_name: 'SalaryComponent',
		entity_cuid: newComponent.cuid,
		action_type: 'create',
		status: 'SUCCESS',
		remarks: `Salary component "${newComponent.name}" of type "${newComponent.type}" created.`
	});

	return newComponent;
}

/**
 * Updates an existing Salary Component master entry.
 * Implements business validation rules (trimming and duplicate checks).
 * @param cuid - The externally-exposed cuid of the salary component
 */
export async function updateComponent(cuid: string, dto: UpdateSalaryComponentDto) {
	// First check if it exists
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new ComponentNotFoundError(cuid);
	}

	const updatedName =
		dto.name !== undefined ? dto.name.trim() : current.name;

	// Business validation: check for duplicates if name is changing
	if (dto.name !== undefined) {
		const existing = await dao.findByName(updatedName);
		if (existing && existing.cuid !== cuid) {
			throw new DuplicateComponentError(updatedName);
		}
	}

	const updated = await dao.update(cuid, {
		...dto,
		name: dto.name !== undefined ? updatedName : undefined
	});

	await auditService.logUpdate({
		entityName: 'SalaryComponent',
		entityCuid: cuid,
		oldRecord: current,
		newRecord: updated
	});

	return updated;
}

/**
 * Retrieves a single Salary Component by its external cuid.
 */
export async function getComponentByCuid(cuid: string) {
	const component = await dao.findByCuid(cuid);
	if (!component) {
		throw new ComponentNotFoundError(cuid);
	}
	return component;
}

/**
 * Retrieves all Salary Components. Search and sorting are handled client-side.
 */
export async function getComponents() {
	return dao.findMany();
}

/**
 * Toggles or sets the status of a Salary Component (soft delete/deactivation).
 * @param cuid - The externally-exposed cuid of the salary component
 */
export async function toggleComponentStatus(
	cuid: string,
	status: boolean,
	updated_by?: string | null
) {
	const current = await dao.findByCuid(cuid);
	if (!current) {
		throw new ComponentNotFoundError(cuid);
	}

	const updated = await dao.update(cuid, { status, updated_by });

	await auditService.logUpdate({
		entityName: 'SalaryComponent',
		entityCuid: cuid,
		oldRecord: current,
		newRecord: updated
	});

	return updated;
}

/**
 * Returns aggregate counts for the stats dashboard cards.
 * No row data is fetched — backed by three parallel COUNT queries.
 */
export async function getStats() {
	return dao.getStats();
}
