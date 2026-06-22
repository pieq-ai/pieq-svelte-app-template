import { db } from '$lib/server/db.js';

export interface UpsertSkillInput {
    cuid?: string;
    skill_cuid: string;
    proficiency_level?: string | null;
    years_of_experience?: number | null;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string) {
    return db.employeeSkill.findMany({
        where: { employee_cuid },
        orderBy: { created_at: 'asc' }
    });
}

export async function replaceSkills(employee_cuid: string, skills: UpsertSkillInput[]) {
    return db.$transaction(async (tx) => {
        const providedCuids = skills.map(s => s.cuid).filter(c => c) as string[];
        
        await tx.employeeSkill.deleteMany({
            where: {
                employee_cuid,
                cuid: { notIn: providedCuids }
            }
        });

        const results = [];
        for (const skill of skills) {
            if (skill.cuid) {
                results.push(await tx.employeeSkill.update({
                    where: { cuid: skill.cuid },
                    data: {
                        skill_cuid: skill.skill_cuid,
                        proficiency_level: skill.proficiency_level,
                        years_of_experience: skill.years_of_experience,
                        updated_by: skill.updated_by
                    }
                }));
            } else {
                results.push(await tx.employeeSkill.create({
                    data: {
                        employee_cuid,
                        skill_cuid: skill.skill_cuid,
                        proficiency_level: skill.proficiency_level,
                        years_of_experience: skill.years_of_experience,
                        created_by: skill.created_by,
                        updated_by: skill.updated_by
                    }
                }));
            }
        }
        return results;
    });
}
