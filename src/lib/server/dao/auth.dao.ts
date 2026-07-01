import { db } from '$lib/server/db.js';

export async function findAuthUserByKeycloakSub(keycloak_sub: string) {
    console.log("[DIAG-4] Prisma Query for Keycloak Sub:", keycloak_sub);
    const rows = await db.$queryRaw`
        SELECT 
            emp.cuid as employee_cuid,
            emp.emp_code,
            emp.first_name,
            emp.last_name,
            emp.profile_completion_status,
            e.cuid as employment_cuid,
            e.official_email,
            e.keycloak_sub,
            sr.cuid as system_role_cuid,
            sr.name as system_role_name
        FROM employments e
        JOIN employees emp ON e.employee_cuid = emp.cuid
        LEFT JOIN system_roles sr ON e.system_role_cuid = sr.cuid
        WHERE e.keycloak_sub = ${keycloak_sub}
        LIMIT 1;
    `;
    
    const data = rows as any[];
    console.log("[DIAG-5] Database Raw Return:", data.length > 0 ? data[0] : null);
    if (data.length === 0) return null;
    return data[0];
}

export async function hasAnyEmployments(): Promise<boolean> {
    const rows = await db.$queryRaw`SELECT 1 FROM employments LIMIT 1;`;
    return (rows as any[]).length > 0;
}
