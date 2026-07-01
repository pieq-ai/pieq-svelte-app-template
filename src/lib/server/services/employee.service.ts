import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as notificationService from '$lib/server/services/notification.service.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as locationDao from '$lib/server/dao/organization_location.dao.js';
import * as addressDao from '$lib/server/dao/address.dao.js';
import * as bankDetailDao from '$lib/server/dao/bank-detail.dao.js';
import * as educationDao from '$lib/server/dao/education.dao.js';
import * as experienceDao from '$lib/server/dao/experience.dao.js';
import * as skillDao from '$lib/server/dao/skill.dao.js';
import * as languageDao from '$lib/server/dao/language.dao.js';
import { personalSchema } from '$lib/schemas/employee.schema.js';
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
    pf_account_no?: string | null;
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
    if (!emp) return null;
    const { id, created_at, updated_at, is_deleted, deleted_at, ...rest } = emp;
    return rest;
}

export async function getEmployees() {
    const employees = await employeeDao.list();
    const employments = await employmentDao.list();
    const empMap = new Map(employments.map(e => [e.employee_cuid, e]));
    return employees.map(emp => {
        const publicEmp = toPublicEmployee(emp);
        if (publicEmp) {
            const empl = empMap.get(emp.cuid);
            publicEmp.date_of_joining = empl?.date_of_joining || null;
            publicEmp.relieving_date = empl?.relieving_date || null;
        }
        return publicEmp;
    });
}

export async function getEmployeeByCuid2(cuid: string) {
    if (!cuid) throw new Error("Employee CUID2 is required");
    const emp = await employeeDao.findByCuid2(cuid);
    if (!emp) throw new Error(`Employee with CUID2 "${cuid}" not found`);
    const publicEmp = toPublicEmployee(emp);
    if (publicEmp) {
        const empl = await employmentDao.findByEmployeeCuid(cuid);
        publicEmp.date_of_joining = empl?.date_of_joining || null;
        publicEmp.relieving_date = empl?.relieving_date || null;
    }
    return publicEmp;
}

export async function generateNextEmployeeCode(): Promise<string> {
    const latest = await employeeDao.getLatestEmployeeCode();
    if (!latest) {
        return 'PQ001';
    }
    const match = latest.match(/^PQ(\d+)$/);
    if (!match) {
        return 'PQ001';
    }
    const nextNumber = parseInt(match[1], 10) + 1;
    return `PQ${nextNumber.toString().padStart(3, '0')}`;
}

export async function createEmployee(dto: CreateEmployeeDto) {
    const validated = personalSchema.parse(dto);
    
    const {
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
        pf_account_no,
        dob,
        remarks,
        ...restDto
    } = validated;

    if (personal_email) {
        const existingEmail = await employeeDao.findByEmail(personal_email);
        if (existingEmail) {
            throw new ValidationError("personal_email", "This email address is already assigned to another employee.");
        }
    }

    if (mobile_no) {
        const existingMobile = await employeeDao.findByMobile(mobile_no);
        if (existingMobile) {
            throw new ValidationError("mobile_no", "Mobile number already exists.");
        }
    }

    const existingAadhar = aadhar_no ? await employeeDao.findByAadhar(aadhar_no) : null;
    if (existingAadhar) {
        throw new ValidationError("aadhar_no", "Aadhar number already exists.");
    }

    const existingPan = pan_no ? await employeeDao.findByPan(pan_no) : null;
    if (existingPan) {
        throw new ValidationError("pan_no", "PAN number already exists.");
    }

    const existingPf = pf_account_no ? await employeeDao.findByPfAccountNo(pf_account_no) : null;
    if (existingPf) {
        throw new ValidationError("pf_account_no", "This PF Account Number is already assigned to another employee.");
    }

    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
        const emp_code = await generateNextEmployeeCode();
        
        try {
            const result = await employeeDao.create({
                ...validated,
                created_by: dto.created_by,
                emp_code,
                profile_completion_status: 'pending'
            });

            // Trigger employee joined notification
            notificationService.send({
                title: "New Team Member",
                body: `${result.first_name} ${result.last_name} has joined the company as a new team member!`,
                category: "announcement",
                type: "info",
                created_by: dto.created_by,
                target: { type: "broadcast" }
            }).catch(err => console.error("Failed to send employee joining notification:", err));

            return toPublicEmployee(result);
        } catch (error: any) {
            // Prisma code for unique constraint violation
            if (error.code === 'P2002' && error.meta?.target?.includes('emp_code')) {
                retries++;
                if (retries >= maxRetries) {
                    throw new ValidationError("emp_code", `Unable to generate a unique employee code after ${maxRetries} attempts. Please try again.`);
                }
                // wait a tiny bit to mitigate tight loop collisions
                await new Promise(res => setTimeout(res, 50 * retries));
                continue;
            }
            throw error;
        }
    }
}

export async function updateEmployee(cuid: string, dto: UpdateEmployeeDto) {
    if (!cuid) throw new Error("Employee CUID is required");
    const emp = await employeeDao.findByCuid2(cuid);
    if (!emp) throw new Error(`Employee with CUID "${cuid}" not found`);

    const validated = personalSchema.partial().parse(dto);
    
    const {
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
        pf_account_no,
        dob,
        remarks,
        ...restDto
    } = validated;

    if (personal_email && personal_email !== emp.personal_email) {
        const existingEmail = await employeeDao.findByEmail(personal_email);
        if (existingEmail && existingEmail.cuid !== cuid) {
            throw new ValidationError("personal_email", "This email address is already assigned to another employee.");
        }
    }

    if (mobile_no && mobile_no !== emp.mobile_no) {
        const existingMobile = await employeeDao.findByMobile(mobile_no);
        if (existingMobile && existingMobile.cuid !== cuid) {
            throw new ValidationError("mobile_no", "Mobile number already exists.");
        }
    }

    if (aadhar_no && aadhar_no !== emp.aadhar_no) {
        const existingAadhar = await employeeDao.findByAadhar(aadhar_no);
        if (existingAadhar && existingAadhar.cuid !== cuid) {
            throw new ValidationError("aadhar_no", "Aadhar number already exists.");
        }
    }

    if (pan_no && pan_no !== emp.pan_no) {
        const existingPan = await employeeDao.findByPan(pan_no);
        if (existingPan && existingPan.cuid !== cuid) {
            throw new ValidationError("pan_no", "PAN number already exists.");
        }
    }

    if (pf_account_no && pf_account_no !== emp.pf_account_no) {
        const existingPf = await employeeDao.findByPfAccountNo(pf_account_no);
        if (existingPf && existingPf.cuid !== cuid) {
            throw new ValidationError("pf_account_no", "This PF Account Number is already assigned to another employee.");
        }
    }

    return toPublicEmployee(await employeeDao.update(cuid, {
        ...validated,
        updated_by: dto.updated_by
    } as employeeDao.UpdateEmployeeInput));
}

export async function checkAndSetProfileCompletionStatus(employee_cuid: string) {
    if (!employee_cuid) return;

    try {
        const [
            emp,
            employment,
            addresses,
            banks
        ] = await Promise.all([
            employeeDao.findByCuid2(employee_cuid),
            employmentDao.findByEmployeeCuid(employee_cuid),
            addressDao.findByEmployeeCuid(employee_cuid),
            bankDetailDao.findByEmployeeCuid(employee_cuid)
        ]);

        if (!emp) return;

        const isCompleted = 
            employment !== null &&
            addresses.length > 0 &&
            banks.length > 0;

        const newStatus = isCompleted ? 'completed' : 'pending';

        if (emp.profile_completion_status !== newStatus) {
            await employeeDao.update(employee_cuid, { profile_completion_status: newStatus } as employeeDao.UpdateEmployeeInput);
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

export async function getMinimalEmployeesForAttendance() {
    const employees = await employeeDao.list();
    const employments = await employmentDao.list();
    const locations = await locationDao.getAllLocations();
    const locMap = new Map(locations.map(l => [l.cuid, l]));
    const empMap = new Map(employments.map(e => [e.employee_cuid, e]));
    return employees.map(emp => {
        const empl = empMap.get(emp.cuid);
        const loc = empl?.location_cuid ? locMap.get(empl.location_cuid) : null;
        return {
            cuid: emp.cuid,
            emp_code: emp.emp_code,
            first_name: emp.first_name,
            last_name: emp.last_name,
            date_of_joining: empl?.date_of_joining || null,
            relieving_date: empl?.relieving_date || null,
            location_cuid: empl?.location_cuid || null,
            latitude: loc?.latitude ? Number(loc.latitude) : null,
            longitude: loc?.longitude ? Number(loc.longitude) : null
        };
    });
}