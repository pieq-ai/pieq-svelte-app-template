import { db } from '$lib/server/db.js';

export interface CreateDesignationInput {
	designation_name: string;
	status?: boolean;
	created_by?: string;
}

export interface UpdateDesignationInput {
	designation_name?: string;
	status?: boolean;
	updated_by?: string;
}

export async function list() {
	return db.designation.findMany({
		orderBy: {
			designation_name: 'asc'
		}
	});
}

export async function findById(id: number) {
	return db.designation.findUnique({
		where: {
			id
		}
	});
}

export async function findByCuid2(cuid2: string) {
	return db.designation.findUnique({
		where: {
			cuid2
		}
	});
}

export async function create(data: CreateDesignationInput) {
	return db.designation.create({
		data: {
			designation_name: data.designation_name,
			status: data.status ?? true,
			created_by: data.created_by,
			updated_by: data.created_by
		}
	});
}

export async function update(cuid2: string, data: UpdateDesignationInput) {
	return db.designation.update({
		where: {
			cuid2
		},
		data
	});
}
