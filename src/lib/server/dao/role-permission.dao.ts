import { db } from '$lib/server/db.js';

export interface CreateRolePermissionInput {
	system_role_cuid: string;
	permission_cuid: string;
	created_by?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export async function list() {
	return db.rolePermission.findMany({
		orderBy: {
			id: 'asc'
		}
	});
}

export async function findById(id: bigint) {
	return db.rolePermission.findUnique({
		where: {
			id
		}
	});
}

export async function findByRoleAndPermission(system_role_cuid: string, permission_cuid: string, tx?: any) {
	const client = tx || db;
	return client.rolePermission.findUnique({
		where: {
			system_role_cuid_permission_cuid: {
				system_role_cuid,
				permission_cuid }
		}
	});
}

export async function create(data: CreateRolePermissionInput, tx?: any) {
	const client = tx || db;
	return client.rolePermission.create({
		data
	});
}

export async function remove(id: bigint) {
	return db.rolePermission.delete({
		where: {
			id
		}
	});
}

export async function removeByRoleAndPermission(system_role_cuid: string, permission_cuid: string, tx?: any) {
	const client = tx || db;
	return client.rolePermission.delete({
		where: {
			system_role_cuid_permission_cuid: {
				system_role_cuid,
				permission_cuid }
		}
	});
}
