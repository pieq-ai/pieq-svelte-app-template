import { findAuthUserByKeycloakSub } from '$lib/server/dao/auth.dao.js';
import { error } from '@sveltejs/kit';

export interface AuthContext {
    keycloak_sub: string;
    employee_cuid: string;
    employment_cuid: string;
    emp_code: string;
    employee_name: string;
    official_email: string;
    system_role_cuid: string;
    system_role_name: string | null;
    profile_completion_status: string;
    permissions: string[];
}

export async function syncAuthenticatedUser(keycloak_sub: string, email?: string): Promise<AuthContext> {
    let userRow = await findAuthUserByKeycloakSub(keycloak_sub);

    if (!userRow) {
        error(403, 'User not found in HRMS database.');
    }

    if (!userRow.system_role_cuid) {
        // "If system_role_cuid is null: Reject login. Return: User has not yet been assigned a system role."
        error(403, 'User has not yet been assigned a system role.');
    }

    const employee_name = [userRow.first_name, userRow.last_name].filter(Boolean).join(' ');

    const returnObj = {
        keycloak_sub: userRow.keycloak_sub,
        employee_cuid: userRow.employee_cuid,
        employment_cuid: userRow.employment_cuid,
        emp_code: userRow.emp_code,
        employee_name: employee_name,
        official_email: userRow.official_email,
        system_role_cuid: userRow.system_role_cuid,
        system_role_name: userRow.system_role_name,
        profile_completion_status: userRow.profile_completion_status,
        permissions: userRow.permissions || []
    };
    console.log("[DIAG-6] syncAuthenticatedUser Return:", returnObj);
    return returnObj;
}
