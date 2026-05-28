import { db } from '$lib/server/db.js';

export interface CreateRolePermissionInput {
	system_role_id: number;
	permission_id: number;
}

export async function list() {
	return db.rolePermission.findMany({
		orderBy: {
			role_permission_id: 'asc'
		}
	});
}

export async function findById(role_permission_id: number) {
	return db.rolePermission.findUnique({
		where: {
			role_permission_id
		}
	});
}

export async function findByRoleAndPermission(system_role_id: number, permission_id: number) {
	return db.rolePermission.findUnique({
		where: {
			system_role_id_permission_id: {
				system_role_id,
				permission_id
			}
		}
	});
}

export async function create(data: CreateRolePermissionInput) {
	return db.rolePermission.create({
		data
	});
}

export async function remove(role_permission_id: number) {
	return db.rolePermission.delete({
		where: {
			role_permission_id
		}
	});
}

export async function removeByRoleAndPermission(system_role_id: number, permission_id: number) {
	return db.rolePermission.delete({
		where: {
			system_role_id_permission_id: {
				system_role_id,
				permission_id
			}
		}
	});
}
