import * as departmentDao from '$lib/server/dao/department.dao.js';
import { validateDepartmentName } from '$lib/server/validators/department.validator.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export interface CreateDepartmentDto {
	name: string;
	name: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string | null;
	updated_at?: Date | string | null;
}

export interface UpdateDepartmentDto {
	name?: string;
	name?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string | null;
}

function toPublicDepartment(department: { cuid: string; name: string; status: boolean; created_at: Date; created_by: string | null; updated_at: Date; updated_by: string | null; }) {
function toPublicDepartment(department: { cuid: string; name: string; status: boolean; created_at: Date; created_by: string | null; updated_at: Date; updated_by: string | null; }) {
	return {
		cuid: department.cuid,
		name: department.name,
		status: department.status,
		created_at: department.created_at,
		created_by: department.created_by,
		updated_at: department.updated_at,
		updated_by: department.updated_by
	};
}

/**
 * Retrieves all departments.
 */
export async function getDepartments() {
	return (await departmentDao.list()).map(toPublicDepartment);
}

/**
 * Retrieves a single department by its public CUID2.
 */
export async function getDepartmentByCuid2(cuid: string) {
	if (!cuid) {
		throw new Error('Department CUID2 is required');
	}
	const department = await departmentDao.findByCuid2(cuid);
	if (!department) {
		throw new Error(`Department with CUID2 "${cuid}" not found`);
	}
	return toPublicDepartment(department);
}

/**
 * Creates a new department.
 * Enforces business rules: trimmed name, min length 2, and uniqueness.
 */
export async function createDepartment(dto: CreateDepartmentDto) {
	const name = validateDepartmentName(dto.name);

	// Uniqueness check
	const existing = await departmentDao.findByName(name);
	if (existing) {
		throw new ValidationError('name', `Department name "${name}" already exists`);
	}

	return toPublicDepartment(await departmentDao.create({
		name,
		status: dto.status ?? true,
		created_by: dto.created_by ?? undefined,
		created_at: dto.created_at ?? undefined,
		updated_at: dto.updated_at ?? undefined
	}));
}

/**
 * Updates a department.
 * Enforces business rules: trimmed name (if provided), min length 2, and uniqueness.
 */
export async function updateDepartment(cuid: string, dto: UpdateDepartmentDto) {
	if (!cuid) {
		throw new Error('Department CUID2 is required');
	}

	const existing = await departmentDao.findByCuid2(cuid);
	if (!existing) {
		throw new Error(`Department with CUID2 "${cuid}" not found`);
	}

	const updateData: departmentDao.UpdateDepartmentInput = {};

	if (dto.updated_at !== undefined) {
		updateData.updated_at = dto.updated_at ?? undefined;
	}

	if (dto.updated_by !== undefined) {
		updateData.updated_by = dto.updated_by;
	}

	if (dto.name !== undefined) {
		const name = validateDepartmentName(dto.name);

		if (name !== existing.name) {
			// Uniqueness check for new name
			const duplicate = await departmentDao.findByName(name);
			if (duplicate) {
				throw new ValidationError('name', `Department name "${name}" already exists`);
			}
		}
		updateData.name = name;
	}

	if (dto.status !== undefined) {
		if (dto.status !== true && dto.status !== false) {
			throw new Error('Status must be a boolean');
		}
		updateData.status = dto.status;
	}

	return toPublicDepartment(await departmentDao.update(cuid, updateData));
}

/**
 * Performs a soft delete by marking the department status as 'inactive'.
 */
export async function deleteDepartment(cuid: string, deletedBy?: string) {
	if (!cuid) {
		throw new Error('Department CUID2 is required');
	}

	const existing = await departmentDao.findByCuid2(cuid);
	if (!existing) {
		throw new Error(`Department with CUID2 "${cuid}" not found`);
	}

	return toPublicDepartment(await departmentDao.update(cuid, {
		status: false,
		updated_by: deletedBy
	}));
}
