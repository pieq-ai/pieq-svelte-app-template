import * as designationDao from '$lib/server/dao/designation.dao.js';

export interface CreateDesignationDto {
	designation_name: string;
	status?: boolean;
}

export interface UpdateDesignationDto {
	designation_name?: string;
	status?: boolean;
}

function toPublicDesignation(designation: {
	cuid2: string;
	designation_name: string;
	status: boolean;
}) {
	return {
		cuid2: designation.cuid2,
		designation_name: designation.designation_name,
		status: designation.status
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

	if (!/^[A-Za-z ]+$/.test(trimmed)) {
		throw new Error('Designation name must contain only letters and spaces');
	}

	return trimmed;
}

async function ensureDesignationNameIsUnique(designation_name: string, currentCuid2?: string) {
	const normalizedName = designation_name.toLowerCase();
	const designations = await designationDao.list();
	const duplicate = designations.find(
		(designation) =>
			designation.cuid2 !== currentCuid2 &&
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

export async function getDesignationByCuid2(cuid2: string) {
	if (!cuid2) {
		throw new Error('Designation CUID2 is required');
	}

	const designation = await designationDao.findByCuid2(cuid2);
	if (!designation) {
		throw new Error(`Designation with CUID2 "${cuid2}" not found`);
	}

	return toPublicDesignation(designation);
}

export async function createDesignation(dto: CreateDesignationDto) {
	const designation_name = validateDesignationName(dto.designation_name);

	await ensureDesignationNameIsUnique(designation_name);

	return toPublicDesignation(await designationDao.create({
		designation_name,
		status: dto.status ?? true
	}));
}

export async function updateDesignation(cuid2: string, dto: UpdateDesignationDto) {
	const existing = await getDesignationByCuid2(cuid2);
	const updateData: designationDao.UpdateDesignationInput = {};

	if (dto.designation_name !== undefined) {
		const designation_name = validateDesignationName(dto.designation_name);

		await ensureDesignationNameIsUnique(designation_name, existing.cuid2);

		updateData.designation_name = designation_name;
	}

	if (dto.status !== undefined) {
		if (dto.status !== true && dto.status !== false) {
			throw new Error('Status must be a boolean');
		}
		updateData.status = dto.status;
	}

	return toPublicDesignation(await designationDao.update(cuid2, updateData));
}

export async function deleteDesignation(cuid2: string) {
	await getDesignationByCuid2(cuid2);

	return toPublicDesignation(await designationDao.update(cuid2, {
		status: false
	}));
}
