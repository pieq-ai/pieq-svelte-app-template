import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as validator from '$lib/server/validators/employee.validator.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export interface CreateEmployeeDto {
    emp_code: string;
    first_name: string;
    last_name: string;
    father_name?: string | null;
    dob?: string | Date | null;
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
    created_by?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
    updated_by?: string;
}

function toPublicEmployee(emp: any) {
    const { id, ...rest } = emp;
    return rest;
}

export async function getEmployees() {
    return (await employeeDao.list()).map(toPublicEmployee);
}

export async function getEmployeeByCuid2(cuid: string) {
    if (!cuid) throw new Error("Employee CUID2 is required");
    const emp = await employeeDao.findByCuid2(cuid);
    if (!emp) throw new Error(`Employee with CUID2 "${cuid}" not found`);
    return toPublicEmployee(emp);
}

export async function createEmployee(dto: CreateEmployeeDto) {
    const emp_code = validator.validateEmpCode(dto.emp_code);
    const first_name = validator.validateName(dto.first_name, "First Name");
    const last_name = validator.validateName(dto.last_name, "Last Name");
    const personal_email = validator.validateEmail(dto.personal_email);
    const pan_no = validator.validatePan(dto.pan_no);
    const aadhar_no = validator.validateAadhar(dto.aadhar_no);
    const dob = validator.validateDob(dto.dob);

    const existingCode = await employeeDao.findByEmpCode(emp_code);
    if (existingCode) {
        throw new ValidationError("emp_code", `Employee code "${emp_code}" already exists`);
    }

    if (personal_email) {
        const existingEmail = await employeeDao.findByEmail(personal_email);
        if (existingEmail) {
            throw new ValidationError("personal_email", `Email "${personal_email}" is already used`);
        }
    }

    return toPublicEmployee(await employeeDao.create({
        ...dto,
        emp_code,
        first_name,
        last_name,
        personal_email,
        pan_no,
        aadhar_no,
        dob,
        father_name: dto.father_name?.trim() || null,
    }));
}

export async function updateEmployee(cuid: string, dto: UpdateEmployeeDto) {
    if (!cuid) throw new Error("Employee CUID2 is required");
    const existing = await employeeDao.findByCuid2(cuid);
    if (!existing) throw new Error(`Employee with CUID2 "${cuid}" not found`);

    const updateData: employeeDao.UpdateEmployeeInput = { ...dto } as employeeDao.UpdateEmployeeInput;
    delete (updateData as any).emp_code; // Do not update emp_code

    if (dto.first_name !== undefined) updateData.first_name = validator.validateName(dto.first_name, "First Name");
    if (dto.last_name !== undefined) updateData.last_name = validator.validateName(dto.last_name, "Last Name");
    
    if (dto.personal_email !== undefined) {
        const email = validator.validateEmail(dto.personal_email);
        if (email && email !== existing.personal_email) {
            const existingEmail = await employeeDao.findByEmail(email);
            if (existingEmail) {
                throw new ValidationError("personal_email", `Email "${email}" is already used`);
            }
        }
        updateData.personal_email = email;
    }

    if (dto.pan_no !== undefined) updateData.pan_no = validator.validatePan(dto.pan_no);
    if (dto.aadhar_no !== undefined) updateData.aadhar_no = validator.validateAadhar(dto.aadhar_no);
    if (dto.dob !== undefined) updateData.dob = validator.validateDob(dto.dob);

    return toPublicEmployee(await employeeDao.update(cuid, updateData));
}