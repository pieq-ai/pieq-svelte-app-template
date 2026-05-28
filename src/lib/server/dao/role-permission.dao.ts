import { db } from '$lib/server/db.js';

export interface CreateRolePermissionInput {
	system_role_cuid2: string;
	permission_cuid2: string;
}

export async function list() {
	return db.rolePermission.findMany({
		orderBy: {
			id: 'asc'
		}
	});
}

export async function findById(id: number) {
	return db.rolePermission.findUnique({
		where: {
			id
		}
	});
}

export async function findByRoleAndPermission(system_role_cuid2: string, permission_cuid2: string) {
	return db.rolePermission.findUnique({
		where: {
			system_role_cuid2_permission_cuid2: {
				system_role_cuid2,
				permission_cuid2 }
		}
	});
}

export async function create(data: CreateRolePermissionInput) {
	return db.rolePermission.create({
		data
	});
}

export async function remove(id: number) {
	return db.rolePermission.delete({
		where: {
			id
		}
	});
}

export async function removeByRoleAndPermission(system_role_cuid2: string, permission_cuid2: string) {
	return db.rolePermission.delete({
		where: {
			system_role_cuid2_permission_cuid2: {
				system_role_cuid2,
				permission_cuid2 }
		}
	});
}
