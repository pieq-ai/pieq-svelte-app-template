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
        where: { is_deleted: false },
		orderBy: { emp_code: 'asc' }
	});
}

export async function findByCuid2(cuid: string) {
	return db.employee.findFirst({
		where: { cuid, is_deleted: false }
	});
}

export async function findByEmpCode(emp_code: string) {
	return db.employee.findFirst({
		where: { emp_code, is_deleted: false }
	});
}

export async function getLatestEmployeeCode() {
    const latest = await db.employee.findFirst({
        where: {
            emp_code: {
                startsWith: 'PQ'
            }
            // we do NOT filter by is_deleted here because we don't want to reuse deleted codes
        },
        orderBy: {
            emp_code: 'desc'
        },
        select: {
            emp_code: true
        }
    });
    return latest?.emp_code || null;
}

export async function findByEmail(email: string) {
	return db.employee.findFirst({
		where: { personal_email: email, is_deleted: false }
	});
}

export async function findByMobile(mobile_no: string) {
	return db.employee.findFirst({
		where: { mobile_no, is_deleted: false }
	});
}

export async function findByAadhar(aadhar_no: string) {
	return db.employee.findFirst({
		where: { aadhar_no, is_deleted: false }
	});
}

export async function findByPan(pan_no: string) {
	return db.employee.findFirst({
		where: { pan_no, is_deleted: false }
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
    return db.employee.update({
        where: { cuid },
        data: { is_deleted: true }
    });
}

export async function getEmployeesByCuids(cuids: string[], tx?: any): Promise<any[]> {
	const client = tx || db;
	return client.employee.findMany({
		where: { cuid: { in: cuids } }
	});
}

export async function getEmployeeByCuid(cuid: string, tx?: any) {
	const client = tx || db;
	return client.employee.findUnique({
		where: { cuid }
	});
}

export async function getActiveEmploymentByOfficialEmail(email: string, tx?: any) {
	const client = tx || db;
	return client.employment.findFirst({
		where: { official_email: email, employment_status: 'active' }
	});
}

export async function getEmployeeByPersonalEmail(email: string, tx?: any) {
	const client = tx || db;
	return client.employee.findFirst({
		where: { personal_email: email, is_deleted: false }
	});
}

export async function getFirstEmployee(tx?: any) {
	const client = tx || db;
	return client.employee.findFirst({
		where: { is_deleted: false }
	});
}

export async function getEmployeeByEmpCode(empCode: string, tx?: any): Promise<any> {
	const client = tx || db;
	return client.employee.findFirst({
		where: { emp_code: empCode }
	});
}
