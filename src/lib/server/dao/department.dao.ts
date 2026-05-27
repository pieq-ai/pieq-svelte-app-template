import { db } from '$lib/server/db.js';

export interface CreateDepartmentInput {
	dept_name: string;
	status?: 'active' | 'inactive';
}

export interface UpdateDepartmentInput {
	dept_name?: string;
	status?: 'active' | 'inactive';
}

/**
 * Retrieves all departments ordered by name.
 */
export async function list() {
	return db.department.findMany({
		orderBy: {
			dept_name: 'asc'
		}
	});
}

/**
 * Finds a department by its unique UUID.
 */
export async function findByUuid(uuid: string) {
	return db.department.findUnique({
		where: {
			uuid
		}
	});
}

/**
 * Finds a department by its unique name (exact match).
 */
export async function findByName(dept_name: string) {
	return db.department.findFirst({
		where: {
			dept_name: {
				equals: dept_name,
				mode: 'insensitive'
			}
		}
	});
}

/**
 * Creates a new department record.
 */
export async function create(data: CreateDepartmentInput) {
	return db.department.create({
		data: {
			dept_name: data.dept_name,
			status: data.status ?? 'active'
		}
	});
}

/**
 * Updates an existing department record by its UUID.
 */
export async function update(uuid: string, data: UpdateDepartmentInput) {
	return db.department.update({
		where: {
			uuid
		},
		data
	});
}
