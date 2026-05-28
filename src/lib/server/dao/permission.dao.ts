import { db } from '$lib/server/db.js';

export interface CreatePermissionInput {
	permission_key: string;
	status?: 'active' | 'inactive';
}

export interface UpdatePermissionInput {
	permission_key?: string;
	status?: 'active' | 'inactive';
}

export async function list() {
	return db.permissions.findMany({
		orderBy: {
			permission_key: 'asc'
		}
	});
}

export async function findById(permission_id: number) {
	return db.permissions.findUnique({
		where: {
			permission_id
		}
	});
}

export async function create(data: CreatePermissionInput) {
	return db.permissions.create({
		data: {
			permission_key: data.permission_key,
			status: data.status ?? 'active'
		}
	});
}

export async function update(permission_id: number, data: UpdatePermissionInput) {
	return db.permissions.update({
		where: {
			permission_id
		},
		data
	});
}
