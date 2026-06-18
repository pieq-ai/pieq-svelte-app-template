import { ValidationError } from '$lib/server/utils/errors.js';
import * as experienceDao from '$lib/server/dao/experience.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import { z } from 'zod';
import { experienceSchema } from '$lib/schemas/employee.schema.js';

export interface UpsertExperienceDto {
    cuid?: string;
    company_name: string;
    role?: string | null;
    description?: string | null;
    from_date?: string | Date | null;
    to_date?: string | Date | null;
    updated_by?: string;
}

function toPublicExperience(exp: any) {
    if (!exp) return null;
    const { id, employee_cuid, created_at, updated_at, ...rest } = exp;
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

    const validatedDtos = z.array(experienceSchema)
        .refine(items => {
            const keys = items.map(i => `${i.company_name}|${i.role}`);
            return new Set(keys).size === keys.length;
        }, { message: "Duplicate experience entries are not allowed", path: ["root"] })
        .parse(dtos);

    const payload = validatedDtos.map((dto: any) => ({
        cuid: dto.cuid,
        company_name: dto.company_name,
        role: dto.role,
        description: dto.description,
        from_date: dto.from_date,
        to_date: dto.to_date,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await experienceDao.replaceExperiences(employee_cuid, payload);
    await employeeService.checkAndSetProfileCompletionStatus(employee_cuid).catch(console.error);
    return results.map(toPublicExperience);
}
