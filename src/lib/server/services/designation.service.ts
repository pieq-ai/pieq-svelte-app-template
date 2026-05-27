import * as designationDao from '$lib/server/dao/designation.dao.js';

export interface CreateDesignationDto {
	designation_name: string;
	status?: 'active' | 'inactive';
}

export interface UpdateDesignationDto {
	designation_name?: string;
	status?: 'active' | 'inactive';
}

function validateDesignationName(name: string | null | undefined): string {
	if (name === undefined || name === null) {
		throw new Error('Designation name is required');
	}

	const trimmed = name.trim();
	if (trimmed === '') {
		throw new Error('Designation name is required');
	}

	if (!/^[A-Za-z ]+$/.test(trimmed)) {
		throw new Error('Designation name must contain only letters and spaces');
	}

	return trimmed;
}

async function ensureDesignationNameIsUnique(designation_name: string, currentUuid?: string) {
	const normalizedName = designation_name.toLowerCase();
	const designations = await designationDao.list();
	const duplicate = designations.find(
		(designation) =>
			designation.uuid !== currentUuid &&
			designation.designation_name.trim().toLowerCase() === normalizedName
	);

	if (duplicate) {
		throw new Error('Designation already exists');
	}
}

export async function getDesignations() {
	return designationDao.list();
}

export async function getDesignationById(designation_id: number) {
	if (!Number.isInteger(designation_id) || designation_id <= 0) {
		throw new Error('Designation ID must be a positive integer');
	}

	const designation = await designationDao.findById(designation_id);
	if (!designation) {
		throw new Error(`Designation with ID "${designation_id}" not found`);
	}

	return designation;
}

export async function getDesignationByUuid(uuid: string) {
	if (!uuid) {
		throw new Error('Designation UUID is required');
	}

	const designation = await designationDao.findByUuid(uuid);
	if (!designation) {
		throw new Error(`Designation with UUID "${uuid}" not found`);
	}

	return designation;
}

export async function createDesignation(dto: CreateDesignationDto) {
	const designation_name = validateDesignationName(dto.designation_name);

	await ensureDesignationNameIsUnique(designation_name);

	return designationDao.create({
		designation_name,
		status: dto.status ?? 'active'
	});
}

export async function updateDesignation(uuid: string, dto: UpdateDesignationDto) {
	const existing = await getDesignationByUuid(uuid);
	const updateData: designationDao.UpdateDesignationInput = {};

	if (dto.designation_name !== undefined) {
		const designation_name = validateDesignationName(dto.designation_name);

		await ensureDesignationNameIsUnique(designation_name, existing.uuid);

		updateData.designation_name = designation_name;
	}

	if (dto.status !== undefined) {
		if (dto.status !== 'active' && dto.status !== 'inactive') {
			throw new Error('Status must be "active" or "inactive"');
		}
		updateData.status = dto.status;
	}

	return designationDao.update(uuid, updateData);
}

export async function deleteDesignation(uuid: string) {
	await getDesignationByUuid(uuid);

	return designationDao.update(uuid, {
		status: 'inactive'
	});
}
