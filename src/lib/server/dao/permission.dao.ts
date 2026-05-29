import { db } from '$lib/server/db.js';

export interface CreatePermissionInput {
	permission_key: string;
	status?: boolean;
	created_by?: string;
}

export interface UpdatePermissionInput {
	permission_key?: string;
	status?: boolean;
	updated_by?: string;
}

export async function list() {
	return db.permissions.findMany({
		orderBy: {
			permission_key: 'asc'
		}
	});
}

export async function findById(id: number) {
	return db.permissions.findUnique({
		where: {
			id
		}
	});
}

export async function findByCuid2(cuid2: string) {
	return db.permissions.findUnique({
		where: {
			cuid2
		}
	});
}

export async function create(data: CreatePermissionInput) {
	return db.permissions.create({
		data: {
			permission_key: data.permission_key,
			status: data.status ?? true,
			created_by: data.created_by,
			updated_by: data.created_by
		}
	});
}

export async function update(id: number, data: UpdatePermissionInput) {
	return db.permissions.update({
		where: {
			id
		},
		data
	});
}
