import { ValidationError } from '$lib/server/utils/errors.js';
import * as skillDao from '$lib/server/dao/skill.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as employeeLifecycleService from '$lib/server/services/employee-lifecycle.service.js';
import { z } from 'zod';
import { skillSchema } from '$lib/schemas/employee.schema.js';

export interface UpsertSkillDto {
    cuid?: string;
    skill_cuid: string;
    proficiency_level?: string | null;
    years_of_experience?: number | string | null;
    updated_by?: string;
}

function toPublicSkill(skill: any) {
    if (!skill) return null;
    const { id, employee_cuid, created_at, updated_at, ...rest } = skill;
    return { ...rest, years_of_experience: (rest.years_of_experience !== null && rest.years_of_experience !== undefined) ? Number(rest.years_of_experience) : null };
}

export async function getSkillsByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await skillDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicSkill);
}

export async function replaceSkills(employee_cuid: string, dtos: UpsertSkillDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    const validatedDtos = z.array(skillSchema)
        .refine((items: any[]) => {
            const skillCuids = items.map((i: any) => i.skill_cuid);
            return new Set(skillCuids).size === skillCuids.length;
        }, { message: "Duplicate skills are not allowed", path: ["root"] })
        .parse(dtos);

    const payload = validatedDtos.map((dto: any) => ({
        cuid: dto.cuid,
        skill_cuid: dto.skill_cuid,
        proficiency_level: dto.proficiency_level,
        years_of_experience: (dto.years_of_experience !== null && dto.years_of_experience !== undefined) ? Number(dto.years_of_experience) : null,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await skillDao.replaceSkills(employee_cuid, payload);
    await employeeLifecycleService.syncEmployeeLifecycle(employee_cuid);
    return results.map(toPublicSkill);
}
