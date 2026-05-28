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

function toPublicDepartment(department: { cuid2: string; dept_name: string; status: 'active' | 'inactive' }) {
	return {
		cuid2: department.cuid2,
		dept_name: department.dept_name,
		status: department.status
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
export async function getDepartmentByCuid2(cuid2: string) {
	if (!cuid2) {
		throw new Error('Department CUID2 is required');
	}
	const department = await departmentDao.findByCuid2(cuid2);
	if (!department) {
		throw new Error(`Department with CUID2 "${cuid2}" not found`);
	}
	return toPublicDepartment(department);
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

	return toPublicDepartment(await departmentDao.create({
		dept_name,
		status: dto.status ?? 'active'
	}));
}

/**
 * Updates a department.
 * Enforces business rules: trimmed name (if provided), min length 2, and uniqueness.
 */
export async function updateDepartment(cuid2: string, dto: UpdateDepartmentDto) {
	if (!cuid2) {
		throw new Error('Department CUID2 is required');
	}

	const existing = await departmentDao.findByCuid2(cuid2);
	if (!existing) {
		throw new Error(`Department with CUID2 "${cuid2}" not found`);
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

	return toPublicDepartment(await departmentDao.update(cuid2, updateData));
}

/**
 * Performs a soft delete by marking the department status as 'inactive'.
 */
export async function deleteDepartment(cuid2: string) {
	if (!cuid2) {
		throw new Error('Department CUID2 is required');
	}

	const existing = await departmentDao.findByCuid2(cuid2);
	if (!existing) {
		throw new Error(`Department with CUID2 "${cuid2}" not found`);
	}

	return toPublicDepartment(await departmentDao.update(cuid2, {
		status: 'inactive'
	}));
}
