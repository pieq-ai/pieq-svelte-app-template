import * as designationDao from '$lib/server/dao/designation.dao.js';

export interface CreateDesignationDto {
	designation_name: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string | null;
	updated_at?: Date | string | null;
}

export interface UpdateDesignationDto {
	designation_name?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string | null;
}

function toPublicDesignation(designation: {
	cuid: string;
	designation_name: string;
	status: boolean;
 created_at: Date; created_by: string | null; updated_at: Date; updated_by: string | null; }) {
	return {
		cuid: designation.cuid,
		designation_name: designation.designation_name,
		status: designation.status
	,
		created_at: designation.created_at,
		created_by: designation.created_by,
		updated_at: designation.updated_at,
		updated_by: designation.updated_by
	};
}

function validateDesignationName(name: string | null | undefined): string {
	if (name === undefined || name === null) {
		throw new Error('Designation name is required');
	}

	const trimmed = name.trim();
	if (trimmed === '') {
		throw new Error('Designation name is required');
	}

	if (!/^[A-Za-z0-9]+(?:\s[A-Za-z0-9]+)*$/.test(trimmed)) {
		throw new Error('Designation can contain only letters, numbers, and spaces. Special characters are not allowed.');
	}

	return trimmed;
}

async function ensureDesignationNameIsUnique(designation_name: string, currentCuid2?: string) {
	const normalizedName = designation_name.toLowerCase();
	const designations = await designationDao.list();
	const duplicate = designations.find(
		(designation) =>
			designation.cuid !== currentCuid2 &&
			designation.designation_name.trim().toLowerCase() === normalizedName
	);

	if (duplicate) {
		throw new Error('Designation already exists');
	}
}

export async function getDesignations() {
	return (await designationDao.list()).map(toPublicDesignation);
}

export async function getDesignationById(designation_id: number) {
	if (!Number.isInteger(designation_id) || designation_id <= 0) {
		throw new Error('Designation ID must be a positive integer');
	}

	const designation = await designationDao.findById(designation_id);
	if (!designation) {
		throw new Error(`Designation with ID "${designation_id}" not found`);
	}

	return toPublicDesignation(designation);
}

export async function getDesignationByCuid2(cuid: string) {
	if (!cuid) {
		throw new Error('Designation CUID2 is required');
	}

	const designation = await designationDao.findByCuid2(cuid);
	if (!designation) {
		throw new Error(`Designation with CUID2 "${cuid}" not found`);
	}

	return toPublicDesignation(designation);
}

export async function createDesignation(dto: CreateDesignationDto) {
	const designation_name = validateDesignationName(dto.designation_name);

	await ensureDesignationNameIsUnique(designation_name);

	return toPublicDesignation(await designationDao.create({
		designation_name,
		status: dto.status ?? true,
		created_by: dto.created_by ?? undefined,
		created_at: dto.created_at ?? undefined,
		updated_at: dto.updated_at ?? undefined
	}));
}

export async function updateDesignation(cuid: string, dto: UpdateDesignationDto) {
	const existing = await getDesignationByCuid2(cuid);
	const updateData: designationDao.UpdateDesignationInput = {};

	if (dto.updated_at !== undefined) {
		updateData.updated_at = dto.updated_at ?? undefined;
	}

	if (dto.updated_by !== undefined) {
		updateData.updated_by = dto.updated_by;
	}

	if (dto.designation_name !== undefined) {
		const designation_name = validateDesignationName(dto.designation_name);

		await ensureDesignationNameIsUnique(designation_name, existing.cuid);

		updateData.designation_name = designation_name;
	}

	if (dto.status !== undefined) {
		if (dto.status !== true && dto.status !== false) {
			throw new Error('Status must be a boolean');
		}
		updateData.status = dto.status;
	}

	return toPublicDesignation(await designationDao.update(cuid, updateData));
}

export async function deleteDesignation(cuid: string, deletedBy?: string) {
	await getDesignationByCuid2(cuid);

	return toPublicDesignation(await designationDao.update(cuid, {
		status: false,
		updated_by: deletedBy
	}));
}
