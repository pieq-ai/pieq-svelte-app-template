import { db } from '$lib/server/db.js';

export interface UpsertLanguageInput {
    cuid?: string;
    language_cuid: string;
    proficiency_level?: string | null;
    can_read?: boolean;
    can_write?: boolean;
    can_speak?: boolean;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string) {
    return db.employeeLanguage.findMany({
        where: { employee_cuid },
        orderBy: { created_at: 'asc' }
    });
}

export async function replaceLanguages(employee_cuid: string, languages: UpsertLanguageInput[]) {
    return db.$transaction(async (tx) => {
        const providedCuids = languages.map(l => l.cuid).filter(c => c) as string[];
        
        await tx.employeeLanguage.deleteMany({
            where: {
                employee_cuid,
                cuid: { notIn: providedCuids }
            }
        });

        const results = [];
        for (const lang of languages) {
            if (lang.cuid) {
                results.push(await tx.employeeLanguage.update({
                    where: { cuid: lang.cuid },
                    data: {
                        language_cuid: lang.language_cuid,
                        proficiency_level: lang.proficiency_level,
                        can_read: lang.can_read ?? false,
                        can_write: lang.can_write ?? false,
                        can_speak: lang.can_speak ?? false,
                        updated_by: lang.updated_by
                    }
                }));
            } else {
                results.push(await tx.employeeLanguage.create({
                    data: {
                        employee_cuid,
                        language_cuid: lang.language_cuid,
                        proficiency_level: lang.proficiency_level,
                        can_read: lang.can_read ?? false,
                        can_write: lang.can_write ?? false,
                        can_speak: lang.can_speak ?? false,
                        created_by: lang.created_by,
                        updated_by: lang.updated_by
                    }
                }));
            }
        }
        return results;
    });
}
