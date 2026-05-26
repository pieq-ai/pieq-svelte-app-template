import { db } from '$lib/server/db.js';

export interface CreateEmployeeData {
	name: string;
	age: number;
}

export async function list() {
	try {
		return await db.employee.findMany({
			orderBy: { id: 'asc' }
		});
	} catch (error) {
		console.error('Error fetching employees from database:', error);
		return [];
	}
}

export async function create(data: CreateEmployeeData) {
	return db.employee.create({
		data: {
			name: data.name,
			age: data.age
		}
	});
}
