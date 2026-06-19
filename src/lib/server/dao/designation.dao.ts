import { db } from '$lib/server/db.js';

export interface CreateDesignationInput {
	name: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export interface UpdateDesignationInput {
	name?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string;
}

export async function list() {
	return db.designation.findMany({
		orderBy: {
			name: 'asc'
		}
	});
}

export async function findById(id: bigint) {
	return db.designation.findUnique({
		where: {
			id
		}
	});
}

export async function findByCuid2(cuid: string) {
	return db.designation.findUnique({
		where: {
			cuid
		}
	});
}

export async function create(data: CreateDesignationInput) {
	return db.designation.create({
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

export async function update(cuid: string, data: UpdateDesignationInput) {
	return db.designation.update({
		where: {
			cuid
		},
		data
	});
}
