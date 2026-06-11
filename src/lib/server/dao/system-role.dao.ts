import { db } from '$lib/server/db.js';

export interface CreateSystemRoleInput {
	name: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export interface UpdateSystemRoleInput {
	name?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string;
}

export async function list() {
	return db.systemRoles.findMany({
		orderBy: {
			name: 'asc'
		}
	});
}

export async function findById(id: bigint) {
	return db.systemRoles.findUnique({
		where: {
			id
		}
	});
}

export async function findByCuid2(cuid: string) {
	return db.systemRoles.findUnique({
		where: {
			cuid
		}
	});
}

export async function create(data: CreateSystemRoleInput) {
	return db.systemRoles.create({
		data: {
			name: data.name,
			status: data.status ?? true,
			created_by: data.created_by ?? undefined,
			updated_by: data.created_by ?? undefined,
			created_at: data.created_at ? new Date(data.created_at) : undefined,
			updated_at: data.updated_at ? new Date(data.updated_at) : undefined
		}
	});
}

export async function update(id: bigint, data: UpdateSystemRoleInput) {
	return db.systemRoles.update({
		where: {
			id
		},
		data
	});
}
