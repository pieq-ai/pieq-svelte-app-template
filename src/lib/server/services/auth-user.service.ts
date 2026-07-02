import { findAuthUserByKeycloakSub, findAuthUserByEmail, updateKeycloakSub, hasAnyEmployments } from '$lib/server/dao/auth.dao.js';
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

    // Auto-heal logic: If Keycloak sub changed (e.g. user recreated in Keycloak)
    // but the email matches an existing employment, update the DB with the new sub.
    if (!userRow && email) {
        userRow = await findAuthUserByEmail(email);
        if (userRow && userRow.employment_cuid) {
            console.log(`[AUTH-HEAL] Found user by email ${email}, updating Keycloak sub to ${keycloak_sub}`);
            await updateKeycloakSub(userRow.employment_cuid, keycloak_sub);
            userRow.keycloak_sub = keycloak_sub;
        }
    }

    if (!userRow) {
        // =======================================================
        // TEMPORARY DEVELOPMENT BOOTSTRAP
        // Remove after first HRMS administrator is provisioned.
        // =======================================================
        const isInitialized = await hasAnyEmployments();
        if (isInitialized) {
            error(403, 'User not found in HRMS database.');
        }

        return {
            keycloak_sub: keycloak_sub,
            employee_cuid: 'bootstrap-employee',
            employment_cuid: 'bootstrap-employment',
            emp_code: 'BOOTSTRAP',
            employee_name: 'Bootstrap Admin',
            official_email: 'bootstrap@local',
            system_role_cuid: 'bootstrap-role-cuid',
            system_role_name: 'Bootstrap Admin',
            profile_completion_status: 'completed',
            permissions: ['*']
        };
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
