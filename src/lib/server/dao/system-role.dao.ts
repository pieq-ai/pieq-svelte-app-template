import { db } from '$lib/server/db.js';

export interface CreateSystemRoleInput {
	system_role_name: string;
	status?: 'active' | 'inactive';
}

export interface UpdateSystemRoleInput {
	system_role_name?: string;
	status?: 'active' | 'inactive';
}

export async function list() {
	return db.systemRoles.findMany({
		orderBy: {
			system_role_name: 'asc'
		}
	});
}

export async function findById(system_role_id: number) {
	return db.systemRoles.findUnique({
		where: {
			system_role_id
		}
	});
}

export async function findByCuid2(cuid2: string) {
	return db.systemRoles.findUnique({
		where: {
			cuid2
		}
	});
}

export async function create(data: CreateSystemRoleInput) {
	return db.systemRoles.create({
		data: {
			system_role_name: data.system_role_name,
			status: data.status ?? 'active'
		}
	});
}

export async function update(system_role_id: number, data: UpdateSystemRoleInput) {
	return db.systemRoles.update({
		where: {
			system_role_id
		},
		data
	});
}
