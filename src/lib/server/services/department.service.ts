import * as departmentDao from '$lib/server/dao/department.dao.js';
import { validateDepartmentName } from '$lib/server/validators/department.validator.js';

export interface CreateDepartmentDto {
	dept_name: string;
	status?: 'active' | 'inactive';
}

export interface UpdateDepartmentDto {
	dept_name?: string;
	status?: 'active' | 'inactive';
}

/**
 * Retrieves all departments.
 */
export async function getDepartments() {
	return departmentDao.list();
}

/**
 * Retrieves a single department by its UUID.
 */
export async function getDepartmentByUuid(uuid: string) {
	if (!uuid) {
		throw new Error('Department UUID is required');
	}
	const department = await departmentDao.findByUuid(uuid);
	if (!department) {
		throw new Error(`Department with UUID "${uuid}" not found`);
	}
	return department;
}

/**
 * Creates a new department.
 * Enforces business rules: trimmed name, min length 2, and uniqueness.
 */
export async function createDepartment(dto: CreateDepartmentDto) {
	const dept_name = validateDepartmentName(dto.dept_name);

	// Uniqueness check
	const existing = await departmentDao.findByName(dept_name);
	if (existing) {
		throw new Error(`Department name "${dept_name}" already exists`);
	}

	return departmentDao.create({
		dept_name,
		status: dto.status ?? 'active'
	});
}

/**
 * Updates a department.
 * Enforces business rules: trimmed name (if provided), min length 2, and uniqueness.
 */
export async function updateDepartment(uuid: string, dto: UpdateDepartmentDto) {
	if (!uuid) {
		throw new Error('Department UUID is required');
	}

	const existing = await departmentDao.findByUuid(uuid);
	if (!existing) {
		throw new Error(`Department with UUID "${uuid}" not found`);
	}

	const updateData: departmentDao.UpdateDepartmentInput = {};

	if (dto.dept_name !== undefined) {
		const dept_name = validateDepartmentName(dto.dept_name);

		if (dept_name !== existing.dept_name) {
			// Uniqueness check for new name
			const duplicate = await departmentDao.findByName(dept_name);
			if (duplicate) {
				throw new Error(`Department name "${dept_name}" already exists`);
			}
		}
		updateData.dept_name = dept_name;
	}

	if (dto.status !== undefined) {
		if (dto.status !== 'active' && dto.status !== 'inactive') {
			throw new Error('Status must be "active" or "inactive"');
		}
		updateData.status = dto.status;
	}

	return departmentDao.update(uuid, updateData);
}

/**
 * Performs a soft delete by marking the department status as 'inactive'.
 */
export async function deleteDepartment(uuid: string) {
	if (!uuid) {
		throw new Error('Department UUID is required');
	}

	const existing = await departmentDao.findByUuid(uuid);
	if (!existing) {
		throw new Error(`Department with UUID "${uuid}" not found`);
	}

	return departmentDao.update(uuid, {
		status: 'inactive'
	});
}
