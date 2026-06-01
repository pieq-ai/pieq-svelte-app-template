import { db } from '$lib/server/db.js';

export interface CreateEmployeeData {
	name: string;
	age: number;
	created_by?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export async function list() {
	try {
		const employees = await db.employee.findMany({
			orderBy: { id: 'asc' }
		});
		return employees.map((emp) => ({
			cuid: emp.cuid,
			name: `${emp.first_name} ${emp.last_name}`,
			age: emp.dob ? new Date().getFullYear() - new Date(emp.dob).getFullYear() : 30
		}));
	} catch (error) {
		console.error('Error fetching employees from database:', error);
		return [];
	}
}

export async function create(data: CreateEmployeeData) {
	const nameParts = data.name.trim().split(/\s+/);
	const firstName = nameParts[0] || 'Unknown';
	const lastName = nameParts.slice(1).join(' ') || 'Employee';

	// Generate random unique fields to satisfy Prisma schema constraints
	const randomNum = Math.floor(Math.random() * 90000) + 10000;
	const empCode = `EMP-${Date.now()}-${randomNum}`.slice(0, 20);
	const mobileNo = `+1${randomNum}555${Math.floor(Math.random() * 900) + 100}`.slice(0, 15);
	const personalEmail = `employee.${randomNum}@example.com`;
	const aadharNo = `12${randomNum}${Math.floor(Math.random() * 900000) + 100000}`.slice(0, 12);
	const panNo = `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`.slice(0, 10);

	const created = await db.employee.create({
		data: {
			emp_code: empCode,
			first_name: firstName,
			last_name: lastName,
			dob: new Date(new Date().getFullYear() - data.age, 0, 1),
			gender: 'Male', // GenderEnum
			blood_group: { connect: { id: 1 } },
			marital_status: 'single', // MaritalStatusEnum
			nationality: { connect: { id: 1 } },
			mobile_no: mobileNo,
			personal_email: personalEmail,
			aadhar_no: aadharNo,
			pan_no: panNo,
			created_by: data.created_by ?? undefined,
			updated_by: data.created_by ?? undefined,
			created_at: data.created_at ? new Date(data.created_at) : undefined,
			updated_at: data.updated_at ? new Date(data.updated_at) : undefined
		}
	});

	return {
		cuid: created.cuid,
		name: `${created.first_name} ${created.last_name}`,
		age: data.age
	};
}
