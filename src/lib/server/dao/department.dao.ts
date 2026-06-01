import { db } from '$lib/server/db.js';

export interface CreateDepartmentInput {
	dept_name: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export interface UpdateDepartmentInput {
	dept_name?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string;
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
export async function findByCuid2(cuid: string) {
	return db.department.findUnique({
		where: {
			cuid
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
			created_by: data.created_by ?? undefined,
			updated_by: data.created_by ?? undefined,
			created_at: data.created_at ? new Date(data.created_at) : undefined,
			updated_at: data.updated_at ? new Date(data.updated_at) : undefined
		}
	});
}

/**
 * Updates an existing department record by its public CUID2.
 */
export async function update(cuid: string, data: UpdateDepartmentInput) {
	return db.department.update({
		where: {
			cuid
		},
		data
	});
}
