import { db } from '$lib/server/db.js';

export interface CreateDesignationInput {
	designation_name: string;
	status?: 'active' | 'inactive';
}

export interface UpdateDesignationInput {
	designation_name?: string;
	status?: 'active' | 'inactive';
}

export async function list() {
	return db.designation.findMany({
		orderBy: {
			designation_name: 'asc'
		}
	});
}

export async function findById(designation_id: number) {
	return db.designation.findUnique({
		where: {
			designation_id
		}
	});
}

export async function findByUuid(uuid: string) {
	return db.designation.findUnique({
		where: {
			uuid
		}
	});
}

export async function create(data: CreateDesignationInput) {
	return db.designation.create({
		data: {
			designation_name: data.designation_name,
			status: data.status ?? 'active'
		}
	});
}

export async function update(uuid: string, data: UpdateDesignationInput) {
	return db.designation.update({
		where: {
			uuid
		},
		data
	});
}
