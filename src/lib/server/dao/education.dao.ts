import { db } from '$lib/server/db.js';

export interface UpsertEducationInput {
    cuid?: string;
    education_level: string;
    specialization?: string | null;
    institution?: string | null;
    university_board?: string | null;
    percentage?: number | null;
    completed_at?: Date | null;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string) {
    return db.employeeEducation.findMany({
        where: { employee_cuid },
        orderBy: { created_at: 'asc' }
    });
}

export async function replaceEducations(employee_cuid: string, educations: UpsertEducationInput[]) {
    return db.$transaction(async (tx) => {
        const providedCuids = educations.map(e => e.cuid).filter(c => c) as string[];
        
        await tx.employeeEducation.deleteMany({
            where: {
                employee_cuid,
                cuid: { notIn: providedCuids }
            }
        });

        const results = [];
        for (const edu of educations) {
            if (edu.cuid) {
                results.push(await tx.employeeEducation.update({
                    where: { cuid: edu.cuid },
                    data: {
                        education_level: edu.education_level,
                        specialization: edu.specialization,
                        institution: edu.institution,
                        university_board: edu.university_board,
                        percentage: edu.percentage,
                        completed_at: edu.completed_at,
                        updated_by: edu.updated_by
                    }
                }));
            } else {
                results.push(await tx.employeeEducation.create({
                    data: {
                        employee_cuid,
                        education_level: edu.education_level,
                        specialization: edu.specialization,
                        institution: edu.institution,
                        university_board: edu.university_board,
                        percentage: edu.percentage,
                        completed_at: edu.completed_at,
                        created_by: edu.created_by,
                        updated_by: edu.updated_by
                    }
                }));
            }
        }
        return results;
    });
}
