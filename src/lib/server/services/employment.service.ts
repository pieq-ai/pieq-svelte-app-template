import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import { validateEmail } from '$lib/server/validators/employee.validator.js';

export interface UpsertEmploymentDto {
    department_cuid: string;
    role_cuid?: string | null;
    designation_cuid: string;
    pay_grade_cuid?: string | null;
    employment_type_cuid?: string | null;
    location_cuid?: string | null;
    reporting_manager_cuid?: string | null;
    employment_status?: string;
    date_of_joining?: string | Date | null;
    confirmation_date?: string | Date | null;
    relieving_date?: string | Date | null;
    official_email?: string | null;
    updated_by?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicEmployment(emp: any) {
    if (!emp) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = emp;
    return rest;
}

export async function getEmploymentByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const emp = await employmentDao.findByEmployeeCuid(employee_cuid);
    return toPublicEmployment(emp);
}

export async function upsertEmployment(employee_cuid: string, dto: UpsertEmploymentDto) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    if (!dto.department_cuid) throw new Error("Department is required");
    if (!dto.designation_cuid) throw new Error("Designation is required");

    const official_email = validateEmail(dto.official_email);
    // Relaxed date validation: date of joining can be in the future, so we don't use validateDob exactly.
    // Let's manually parse.
    const date_of_joining = dto.date_of_joining ? new Date(dto.date_of_joining) : null;
    const confirmation_date = dto.confirmation_date ? new Date(dto.confirmation_date) : null;
    const relieving_date = dto.relieving_date ? new Date(dto.relieving_date) : null;

    if (date_of_joining && isNaN(date_of_joining.getTime())) throw new Error("Invalid date of joining");
    if (confirmation_date && isNaN(confirmation_date.getTime())) throw new Error("Invalid confirmation date");
    if (relieving_date && isNaN(relieving_date.getTime())) throw new Error("Invalid relieving date");

    if (employee.dob && date_of_joining) {
        if (date_of_joining < new Date(employee.dob)) {
            throw new Error("Joining date cannot be before date of birth");
        }
    }

    if (confirmation_date && date_of_joining) {
        if (confirmation_date < date_of_joining) {
            throw new Error("Confirmation date cannot be earlier than joining date");
        }
    }

    if (relieving_date && date_of_joining) {
        if (relieving_date < date_of_joining) {
            throw new Error("Relieving date cannot be earlier than joining date");
        }
    }

    const payload: employmentDao.UpsertEmploymentInput = {
        department_cuid: dto.department_cuid,
        role_cuid: dto.role_cuid,
        designation_cuid: dto.designation_cuid,
        pay_grade_cuid: dto.pay_grade_cuid,
        employment_type_cuid: dto.employment_type_cuid,
        location_cuid: dto.location_cuid,
        reporting_manager_cuid: dto.reporting_manager_cuid,
        employment_status: dto.employment_status,
        date_of_joining,
        confirmation_date,
        relieving_date,
        official_email,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    };

    const result = await employmentDao.upsert(employee_cuid, payload);
    await employeeService.checkAndSetProfileCompletionStatus(employee_cuid).catch(console.error);
    return toPublicEmployment(result);
}
