import * as designationDao from '$lib/server/dao/designation.dao.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export interface CreateDesignationDto {
	name: string;
	name: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string | null;
	updated_at?: Date | string | null;
}

export interface UpdateDesignationDto {
	name?: string;
	name?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string | null;
}

function toPublicDesignation(designation: { cuid: string; name: string; status: boolean; created_at: Date; created_by: string | null; updated_at: Date; updated_by: string | null; }) {
	return {
		cuid: designation.cuid,
		name: designation.name,
		status: designation.status,
		created_at: designation.created_at,
		created_by: designation.created_by,
		updated_at: designation.updated_at,
		updated_by: designation.updated_by
	};
}

export function validateDesignationName(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) {
		throw new ValidationError('name', 'Designation name cannot be empty or just whitespace');
	}
	if (trimmed.length < 2) {
		throw new ValidationError('name', 'Designation name must be at least 2 characters long');
	}
	return trimmed;
}

async function ensureDesignationNameIsUnique(name: string, currentCuid2?: string) {
	const normalizedName = name.toLowerCase();
	const existingList = await designationDao.list();

	const isDuplicate = existingList.some(
		(designation) =>
			designation.cuid !== currentCuid2 &&
			designation.name.trim().toLowerCase() === normalizedName
	);

	if (isDuplicate) {
		throw new ValidationError('name', 'Designation already exists');
	if (duplicate) {
		throw new ValidationError('name', 'Designation already exists');
	}
}

/**
 * Retrieves all designations ordered by name.
 */
export async function getDesignations() {
	const designations = await designationDao.list();
	return designations.map(toPublicDesignation);
}

/**
 * Finds a specific designation by its public CUID2.
 */
export async function getDesignationByCuid(cuid: string) {
	const designation = await designationDao.findByCuid2(cuid);
	if (!designation) {
		throw new Error('Designation not found');
	}
	return toPublicDesignation(designation);
}

/**
 * Creates a new designation.
 * Enforces business rules: trimmed name, min length 2, and uniqueness.
 */
export async function createDesignation(dto: CreateDesignationDto) {
	const name = validateDesignationName(dto.name);
	const name = validateDesignationName(dto.name);

	await ensureDesignationNameIsUnique(name);
	await ensureDesignationNameIsUnique(name);

	return toPublicDesignation(await designationDao.create({
		name,
		name,
		status: dto.status ?? true,
		created_by: dto.created_by ?? undefined,
		created_at: dto.created_at ?? undefined,
		updated_at: dto.updated_at ?? undefined
	}));
}

/**
 * Updates an existing designation by its public CUID2.
 * Only provided fields are updated.
 */
export async function updateDesignation(cuid: string, dto: UpdateDesignationDto) {
	const existing = await designationDao.findByCuid2(cuid);
	if (!existing) {
		throw new Error('Designation not found');
	}

	const updateData: Partial<Parameters<typeof designationDao.update>[1]> = {};

	if (dto.updated_by) {
		updateData.updated_by = dto.updated_by;
	}

	if (dto.name !== undefined) {
		const name = validateDesignationName(dto.name);
	if (dto.name !== undefined) {
		const name = validateDesignationName(dto.name);

		await ensureDesignationNameIsUnique(name, existing.cuid);
		await ensureDesignationNameIsUnique(name, existing.cuid);

		updateData.name = name;
		updateData.name = name;
	}

	if (dto.status !== undefined) {
		updateData.status = dto.status;
	}

	if (Object.keys(updateData).length > 0 && !updateData.updated_at) {
		updateData.updated_at = dto.updated_at ?? new Date();
	}

	return toPublicDesignation(await designationDao.update(cuid, updateData));
}

/**
 * Soft deletes a designation.
 */
export async function deleteDesignation(cuid: string) {
	await getDesignationByCuid(cuid); // ensure it exists
	return designationDao.update(cuid, { status: false, updated_at: new Date() });
}
