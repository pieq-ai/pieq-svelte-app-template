import { json } from '@sveltejs/kit';
import * as employeeDao from '$lib/server/dao/employee.dao';

export async function GET() {
	try {
		const employees = await employeeDao.list();
		return json({ data: employees });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const body = await request.json();
		const { name, age } = body;

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required and must be a string' }, { status: 400 });
		}

		if (age === undefined || isNaN(Number(age))) {
			return json({ error: 'Age is required and must be a valid number' }, { status: 400 });
		}

		const employee = await employeeDao.create({ name, age: Number(age) });
		return json({ data: employee }, { status: 201 });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 500 });
	}
}
