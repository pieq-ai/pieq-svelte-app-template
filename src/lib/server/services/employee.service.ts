import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as addressDao from '$lib/server/dao/address.dao.js';
import * as bankDetailDao from '$lib/server/dao/bank-detail.dao.js';
import * as educationDao from '$lib/server/dao/education.dao.js';
import * as experienceDao from '$lib/server/dao/experience.dao.js';
import * as skillDao from '$lib/server/dao/skill.dao.js';
import * as languageDao from '$lib/server/dao/language.dao.js';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicEmployee(emp: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export async function generateNextEmployeeCode(): Promise<string> {
    const latest = await employeeDao.getLatestEmployeeCode();
    if (!latest) {
        return 'PQ001';
    }
    const match = latest.match(/^PQ(\d{3})$/);
    if (!match) {
        return 'PQ001';
    }
    const nextNumber = parseInt(match[1], 10) + 1;
    return `PQ${nextNumber.toString().padStart(3, '0')}`;
}

export async function createEmployee(dto: CreateEmployeeDto) {
    // Auto-generate employee code if missing or to ensure sequence
    // Although the frontend might send it, generating it on the server ensures uniqueness and safety against race conditions
    const emp_code = await generateNextEmployeeCode();
    
    const first_name = validator.validateName(dto.first_name, "First Name");
    const last_name = validator.validateName(dto.last_name, "Last Name");
    const father_name = validator.validateName(dto.father_name, "Father's Name");
    const personal_email = validator.validateEmail(dto.personal_email);
    const mobile_no = validator.validateMobile(dto.mobile_no, "Mobile Number");
    const emergency_contact_name = validator.validateName(dto.emergency_contact_name, "Emergency Contact Name");
    const emergency_contact_no = validator.validateMobile(dto.emergency_contact_no, "Emergency Contact Number");
    
    const pan_no = validator.validatePan(dto.pan_no);
    const aadhar_no = validator.validateAadhar(dto.aadhar_no);
    const uan_no = validator.validateUan(dto.uan_no);
    const esi_no = validator.validateEsi(dto.esi_no);
    
    const dob = validator.validateDob(dto.dob);
    const remarks = validator.validateRemarks(dto.remarks);

    const existingCode = await employeeDao.findByEmpCode(emp_code);
    if (existingCode) {
        throw new ValidationError("emp_code", `Employee code "${emp_code}" already exists. Please try saving again.`);
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
        father_name,
        personal_email,
        mobile_no,
        emergency_contact_name,
        emergency_contact_no,
        pan_no,
        aadhar_no,
        uan_no,
        esi_no,
        dob,
        remarks,
        profile_completion_status: 'pending'
    }));
}

export async function updateEmployee(cuid: string, dto: UpdateEmployeeDto) {
    if (!cuid) throw new Error("Employee CUID2 is required");
    const existing = await employeeDao.findByCuid2(cuid);
    if (!existing) throw new Error(`Employee with CUID2 "${cuid}" not found`);

    const updateData: employeeDao.UpdateEmployeeInput = { ...dto } as employeeDao.UpdateEmployeeInput;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (updateData as any).emp_code; // Do not update emp_code

    if (dto.first_name !== undefined) updateData.first_name = validator.validateName(dto.first_name, "First Name");
    if (dto.last_name !== undefined) updateData.last_name = validator.validateName(dto.last_name, "Last Name");
    if (dto.father_name !== undefined) updateData.father_name = validator.validateName(dto.father_name, "Father's Name");
    if (dto.mobile_no !== undefined) updateData.mobile_no = validator.validateMobile(dto.mobile_no, "Mobile Number");
    if (dto.emergency_contact_name !== undefined) updateData.emergency_contact_name = validator.validateName(dto.emergency_contact_name, "Emergency Contact Name");
    if (dto.emergency_contact_no !== undefined) updateData.emergency_contact_no = validator.validateMobile(dto.emergency_contact_no, "Emergency Contact Number");
    
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
    if (dto.uan_no !== undefined) updateData.uan_no = validator.validateUan(dto.uan_no);
    if (dto.esi_no !== undefined) updateData.esi_no = validator.validateEsi(dto.esi_no);
    if (dto.remarks !== undefined) updateData.remarks = validator.validateRemarks(dto.remarks);
    if (dto.dob !== undefined) updateData.dob = validator.validateDob(dto.dob);

    return toPublicEmployee(await employeeDao.update(cuid, updateData));
}

export async function checkAndSetProfileCompletionStatus(employee_cuid: string) {
    if (!employee_cuid) return;

    try {
        const [
            emp,
            employment,
            addresses,
            banks,
            educations,
            experiences,
            skills,
            languages
        ] = await Promise.all([
            employeeDao.findByCuid2(employee_cuid),
            employmentDao.findByEmployeeCuid(employee_cuid),
            addressDao.findByEmployeeCuid(employee_cuid),
            bankDetailDao.findByEmployeeCuid(employee_cuid),
            educationDao.findByEmployeeCuid(employee_cuid),
            experienceDao.findByEmployeeCuid(employee_cuid),
            skillDao.findByEmployeeCuid(employee_cuid),
            languageDao.findByEmployeeCuid(employee_cuid)
        ]);

        if (!emp) return;

        const isCompleted = 
            employment !== null &&
            addresses.length > 0 &&
            banks.length > 0 &&
            educations.length > 0 &&
            experiences.length > 0 &&
            skills.length > 0 &&
            languages.length > 0;

        const newStatus = isCompleted ? 'completed' : 'pending';

        if (emp.profile_completion_status !== newStatus) {
            await employeeDao.update(employee_cuid, { profile_completion_status: newStatus });
        }
    } catch (error) {
        console.error('Failed to calculate profile completion status', error);
    }
}

export async function deleteEmployee(cuid: string) {
    if (!cuid) throw new Error("Employee CUID2 is required");
    const existing = await employeeDao.findByCuid2(cuid);
    if (!existing) throw new Error(`Employee with CUID2 "${cuid}" not found`);
    return toPublicEmployee(await employeeDao.remove(cuid));
}