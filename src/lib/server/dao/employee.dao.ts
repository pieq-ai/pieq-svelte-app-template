import { db } from '$lib/server/db.js';

export interface CreateEmployeeData {
	name: string;
	age: number;
}

export interface EmployeeCompatibility {
	uuid: string;
	name: string;
	age: number;
	id: bigint;
}

function calculateAge(dob: Date | null): number {
	if (!dob) return 30;
	const today = new Date();
	let age = today.getFullYear() - dob.getFullYear();
	const m = today.getMonth() - dob.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
		age--;
	}
	return age;
}

export async function list(): Promise<EmployeeCompatibility[]> {
	const dbEmployees = await db.employee.findMany({
		orderBy: { id: 'asc' }
	});
	return dbEmployees.map((emp) => ({
		id: emp.id,
		uuid: emp.cuid,
		name: `${emp.first_name} ${emp.last_name}`.trim(),
		age: calculateAge(emp.dob)
	}));
}

export async function create(data: CreateEmployeeData): Promise<EmployeeCompatibility> {
	const parts = data.name.trim().split(/\s+/);
	const first_name = parts[0] || 'Unknown';
	const last_name = parts.slice(1).join(' ') || 'Employee';
	const emp_code = `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
	
	const today = new Date();
	const birthYear = today.getFullYear() - data.age;
	const dob = new Date(birthYear, 0, 1);

	const created = await db.employee.create({
		data: {
			emp_code,
			first_name,
			last_name,
			dob,
			profile_completion_status: 'pending'
		}
	});

	return {
		id: created.id,
		uuid: created.cuid,
		name: `${created.first_name} ${created.last_name}`.trim(),
		age: calculateAge(created.dob)
	};
}

export async function getEmployeeByCuid(cuid: string, tx?: any): Promise<any> {
	const client = tx || db;
	return client.employee.findUnique({
		where: { cuid }
	});
}

export async function getEmployeeByPersonalEmail(email: string, tx?: any): Promise<any> {
	const client = tx || db;
	return client.employee.findFirst({
		where: { personal_email: email }
	});
}

export async function getFirstEmployee(tx?: any): Promise<any> {
	const client = tx || db;
	return client.employee.findFirst({
		orderBy: { id: 'asc' }
	});
}

export async function getActiveEmploymentByOfficialEmail(email: string, tx?: any): Promise<any> {
	const client = tx || db;
	return client.employment.findFirst({
		where: { official_email: email, employment_status: 'active' }
	});
}

export async function getFirstEmployment(tx?: any): Promise<any> {
	const client = tx || db;
	return client.employment.findFirst({
		orderBy: { id: 'asc' }
	});
}

export async function getActiveEmployeesWithEmployment(tx?: any): Promise<any[]> {
	const client = tx || db;
	return client.employee.findMany({
		where: {
			employments: {
				some: { employment_status: 'active' }
			}
		},
		include: {
			employments: {
				where: { employment_status: 'active' }
			}
		}
	});
}

export async function getEmployeesByCuids(cuids: string[], tx?: any): Promise<any[]> {
	const client = tx || db;
	return client.employee.findMany({
		where: { cuid: { in: cuids } }
	});
}

export async function getEmployeeByEmpCode(empCode: string, tx?: any): Promise<any> {
	const client = tx || db;
	return client.employee.findFirst({
		where: { emp_code: empCode }
	});
}