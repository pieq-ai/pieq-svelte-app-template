import { db } from '$lib/server/db.js';

export interface UpsertExperienceInput {
    cuid?: string;
    company_name: string;
    role?: string | null;
    description?: string | null;
    from_date?: Date | null;
    to_date?: Date | null;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string) {
    return db.employeeExperience.findMany({
        where: { employee_cuid },
        orderBy: { created_at: 'asc' }
    });
}

export async function replaceExperiences(employee_cuid: string, experiences: UpsertExperienceInput[]) {
    return db.$transaction(async (tx) => {
        const providedCuids = experiences.map(e => e.cuid).filter(c => c) as string[];
        
        await tx.employeeExperience.deleteMany({
            where: {
                employee_cuid,
                cuid: { notIn: providedCuids }
            }
        });

        const results = [];
        for (const exp of experiences) {
            if (exp.cuid) {
                results.push(await tx.employeeExperience.update({
                    where: { cuid: exp.cuid },
                    data: {
                        company_name: exp.company_name,
                        role: exp.role,
                        description: exp.description,
                        from_date: exp.from_date,
                        to_date: exp.to_date,
                        updated_by: exp.updated_by
                    }
                }));
            } else {
                results.push(await tx.employeeExperience.create({
                    data: {
                        employee_cuid,
                        company_name: exp.company_name,
                        role: exp.role,
                        description: exp.description,
                        from_date: exp.from_date,
                        to_date: exp.to_date,
                        created_by: exp.created_by,
                        updated_by: exp.updated_by
                    }
                }));
            }
        }
        return results;
    });
}
