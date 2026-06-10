import * as skillDao from '$lib/server/dao/skill.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';

export interface UpsertSkillDto {
    cuid?: string;
    skill_cuid: string;
    proficiency_level?: string | null;
    years_of_experience?: number | string | null;
    updated_by?: string;
}

function toPublicSkill(skill: any) {
    if (!skill) return null;
    const { id, years_of_experience, ...rest } = skill;
    return { ...rest, years_of_experience: years_of_experience ? Number(years_of_experience) : null };
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

    if (!Array.isArray(dtos)) throw new Error("Skills must be an array");

    for (const dto of dtos) {
        if (!dto.skill_cuid) throw new Error("Skill reference is required");
    }

    const payload = dtos.map(dto => ({
        cuid: dto.cuid,
        skill_cuid: dto.skill_cuid,
        proficiency_level: dto.proficiency_level,
        years_of_experience: dto.years_of_experience ? Number(dto.years_of_experience) : null,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await skillDao.replaceSkills(employee_cuid, payload);
    return results.map(toPublicSkill);
}
