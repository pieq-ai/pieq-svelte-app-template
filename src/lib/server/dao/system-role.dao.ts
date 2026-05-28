import { db } from '$lib/server/db.js';

export interface CreateSystemRoleInput {
	system_role_name: string;
	status?: boolean;
}

export interface UpdateSystemRoleInput {
	system_role_name?: string;
	status?: boolean;
}

export async function list() {
	return db.systemRoles.findMany({
		orderBy: {
			system_role_name: 'asc'
		}
	});
}

export async function findById(id: number) {
	return db.systemRoles.findUnique({
		where: {
			id
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
			status: data.status ?? true
		}
	});
}

export async function update(id: number, data: UpdateSystemRoleInput) {
	return db.systemRoles.update({
		where: {
			id
		},
		data
	});
}
