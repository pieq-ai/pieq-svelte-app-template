import { db } from '$lib/server/db.js';

export interface CreateEmployeeData {
	name: string;
	age: number;
}

export async function list() {
	try {
		return await db.employee.findMany({
			orderBy: { emp_id: 'asc' }
		});
	} catch (error) {
		console.error('Error fetching employees from database:', error);
		return [];
	}
}

export async function create(data: CreateEmployeeData) {
	// NOTE: The full Employee model requires many additional fields (dob, gender, etc.).
	// This demo stub exists only for the /employees example route.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return db.employee.create({ data: data as any });
}
