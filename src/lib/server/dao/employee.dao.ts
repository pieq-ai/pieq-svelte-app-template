import { db } from '$lib/server/db.js';

export interface CreateEmployeeData {
	name: string;
	age: number;
}

export async function list() {
	return db.employee.findMany({
		orderBy: { id: 'asc' }
	});
}

export async function create(data: CreateEmployeeData) {
	return (db as any).employee.create({
		data: {
			name: data.name,
			age: data.age
		}
	});
}
