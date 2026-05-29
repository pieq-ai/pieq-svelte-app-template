import { db } from '$lib/server/db.js';

export interface CreateDepartmentInput {
	dept_name: string;
	status?: boolean;
	created_by?: string;
}

export interface UpdateDepartmentInput {
	dept_name?: string;
	status?: boolean;
	updated_by?: string;
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
 * Finds a department by its public CUID2.
 */
export async function findByCuid2(cuid2: string) {
	return db.department.findUnique({
		where: {
			cuid2
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
			status: data.status ?? true,
			created_by: data.created_by,
			updated_by: data.created_by
		}
	});
}

/**
 * Updates an existing department record by its public CUID2.
 */
export async function update(cuid2: string, data: UpdateDepartmentInput) {
	return db.department.update({
		where: {
			cuid2
		},
		data
	});
}
