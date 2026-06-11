import * as experienceDao from '$lib/server/dao/experience.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';

export interface UpsertExperienceDto {
    cuid?: string;
    company_name: string;
    role?: string | null;
    description?: string | null;
    from_date?: string | Date | null;
    to_date?: string | Date | null;
    updated_by?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicExperience(exp: any) {
    if (!exp) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = exp;
    return rest;
}

export async function getExperiencesByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await experienceDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicExperience);
}

export async function replaceExperiences(employee_cuid: string, dtos: UpsertExperienceDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    if (!Array.isArray(dtos)) throw new Error("Experiences must be an array");

    for (const dto of dtos) {
        if (!dto.company_name) throw new Error("Company name is required");
    }

    const payload = dtos.map(dto => {
        const from_date = dto.from_date ? new Date(dto.from_date) : null;
        const to_date = dto.to_date ? new Date(dto.to_date) : null;
        
        if (from_date && to_date && from_date > to_date) {
            throw new Error("Experience from_date cannot be after to_date");
        }
        if (to_date && to_date > new Date()) {
            throw new Error("Experience to_date cannot be in the future");
        }

        return {
            cuid: dto.cuid,
            company_name: dto.company_name,
            role: dto.role,
            description: dto.description,
            from_date,
            to_date,
            created_by: dto.updated_by,
            updated_by: dto.updated_by
        };
    });

    const results = await experienceDao.replaceExperiences(employee_cuid, payload);
    await employeeService.checkAndSetProfileCompletionStatus(employee_cuid).catch(console.error);
    return results.map(toPublicExperience);
}
