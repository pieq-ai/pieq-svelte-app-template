import { db } from '$lib/server/db.js';

export interface CreateEmployeeData {
	name: string;
	age: number;
}

export interface EmployeeResult {
	id: number;
	uuid: string;
	name: string;
	age: number;
}

function mapEmployee(emp: {
	id: bigint;
	uuid: string;
	first_name: string;
	last_name: string;
	dob: Date;
}): EmployeeResult {
	return {
		id: Number(emp.id),
		uuid: emp.uuid,
		name: `${emp.first_name} ${emp.last_name}`.trim(),
		age: new Date().getFullYear() - emp.dob.getFullYear()
	};
}

export async function list(): Promise<EmployeeResult[]> {
	const employees = await db.employee.findMany({
		orderBy: { id: 'asc' }
	});
	return employees.map(mapEmployee);
}

export async function create(data: CreateEmployeeData): Promise<EmployeeResult> {
	const parts = data.name.trim().split(/\s+/);
	const first_name = parts[0] || 'Unknown';
	const last_name = parts.slice(1).join(' ') || '';

	const birthYear = new Date().getFullYear() - data.age;
	const dob = new Date(birthYear, 0, 1);

	const randomStr = () => Math.random().toString(36).substring(2, 9).toUpperCase();
	const emp_code = `EMP-${randomStr()}`;
	const mobile_no = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
	const personal_email = `${randomStr().toLowerCase()}@example.com`;
	const aadhar_no = `1${Math.floor(10000000000 + Math.random() * 90000000000)}`;
	const pan_no = `${randomStr().substring(0, 5)}${Math.floor(1000 + Math.random() * 9000)}${randomStr().substring(0, 1)}`;

	const created = await db.employee.create({
		data: {
			emp_code,
			first_name,
			last_name,
			dob,
			gender: 'Male',
			blood_group_id: 1,
			marital_status: 'single',
			nationality_id: 1,
			mobile_no,
			personal_email,
			aadhar_no,
			pan_no
		}
	});

	return mapEmployee(created);
}
