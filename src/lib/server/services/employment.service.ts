import { ValidationError } from '$lib/server/utils/errors.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import { employmentSchema } from '$lib/schemas/employee.schema.js';

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

function toPublicEmployment(emp: any) {
    if (!emp) return null;
    const { id, employee_cuid, created_at, updated_at, ...rest } = emp;
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

    const validated = employmentSchema.parse(dto);

    if (employee.dob && validated.date_of_joining) {
        if (validated.date_of_joining < new Date(employee.dob)) {
            throw new ValidationError("employment", "Joining date cannot be before date of birth");
        }
    }

    if (validated.reporting_manager_cuid && validated.reporting_manager_cuid === employee_cuid) {
        throw new ValidationError("reporting_manager_cuid", "Employee cannot be their own reporting manager");
    }

    const payload: employmentDao.UpsertEmploymentInput = {
        department_cuid: validated.department_cuid,
        role_cuid: validated.role_cuid,
        designation_cuid: validated.designation_cuid,
        pay_grade_cuid: validated.pay_grade_cuid,
        employment_type_cuid: validated.employment_type_cuid,
        location_cuid: validated.location_cuid,
        reporting_manager_cuid: validated.reporting_manager_cuid,
        employment_status: validated.employment_status ?? undefined,
        date_of_joining: validated.date_of_joining,
        confirmation_date: validated.confirmation_date,
        relieving_date: validated.relieving_date,
        official_email: validated.official_email,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    };

    const result = await employmentDao.upsert(employee_cuid, payload);
    await employeeService.checkAndSetProfileCompletionStatus(employee_cuid).catch(console.error);
    return toPublicEmployment(result);
}
