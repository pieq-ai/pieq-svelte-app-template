import { db } from '$lib/server/db.js';

export interface CreateEmployeeInput {
	emp_code: string;
	first_name: string;
	last_name: string;
	father_name?: string | null;
	dob?: Date | null;
	gender?: string | null;
	marital_status?: string | null;
	blood_group_cuid?: string | null;
	nationality_cuid?: string | null;
	mobile_no?: string | null;
	personal_email?: string | null;
	aadhar_no?: string | null;
	pan_no?: string | null;
	uan_no?: string | null;
	esi_no?: string | null;
	emergency_contact_name?: string | null;
	emergency_contact_no?: string | null;
	relation_cuid?: string | null;
	remarks?: string | null;
	profile_completion_status?: string;
	created_by?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
	updated_by?: string;
}

export async function list() {
	return db.employee.findMany({
		orderBy: { emp_code: 'asc' }
	});
}

export async function findByCuid2(cuid: string) {
	return db.employee.findUnique({
		where: { cuid }
	});
}

export async function findByEmpCode(emp_code: string) {
	return db.employee.findUnique({
		where: { emp_code }
	});
}

export async function findByEmail(email: string) {
	return db.employee.findFirst({
		where: { personal_email: email }
	});
}

export async function create(data: CreateEmployeeInput) {
	return db.employee.create({
		data: {
			...data,
			profile_completion_status: data.profile_completion_status ?? 'pending'
		}
	});
}

export async function update(cuid: string, data: UpdateEmployeeInput) {
	return db.employee.update({
		where: { cuid },
		data
	});
}

export async function remove(cuid: string) {
    return db.employee.delete({
        where: { cuid }
    });
}