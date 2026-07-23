import { db } from '$lib/server/db.js';

export interface UpsertEmploymentInput {
    department_cuid: string;
    role_cuid?: string | null;
    designation_cuid: string;
    pay_grade_cuid?: string | null;
    employment_type_cuid?: string | null;
    location_cuid?: string | null;
    reporting_manager_cuid?: string | null;
    employment_status?: string;
    date_of_joining?: Date | null;
    confirmation_date?: Date | null;
    relieving_date?: Date | null;
    official_email?: string | null;
    keycloak_sub?: string | null;
    system_role_cuid?: string | null;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string, tx?: any) {
    const client = tx || db;
    return client.employment.findFirst({
        where: { employee_cuid },
        orderBy: { created_at: 'desc' }
    });
}

export async function findByOfficialEmail(official_email: string) {
    return db.employment.findFirst({
        where: { official_email },
        orderBy: { created_at: 'desc' }
    });
}

export async function list() {
    return db.employment.findMany();
}

export async function upsert(employee_cuid: string, data: UpsertEmploymentInput, tx?: any) {
    const client = tx || db;
    const existing = await findByEmployeeCuid(employee_cuid, client);
    if (existing) {
        return client.employment.update({
            where: { cuid: existing.cuid },
            data: {
                ...data,
                updated_by: data.updated_by
            }
        });
    } else {
        return client.employment.create({
            data: {
                ...data,
                employee_cuid,
                employment_status: data.employment_status ?? 'onboarding',
                created_by: data.created_by,
                updated_by: data.updated_by
            }
        });
    }
}
