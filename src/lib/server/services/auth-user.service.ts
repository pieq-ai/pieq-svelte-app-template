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
    profile_completion_status: string;
}

export async function syncAuthenticatedUser(keycloak_sub: string): Promise<AuthContext> {
    const userRow = await findAuthUserByKeycloakSub(keycloak_sub);

    if (!userRow) {
        // =======================================================
        // TEMPORARY DEVELOPMENT BOOTSTRAP
        // Remove after first HRMS administrator is provisioned.
        // =======================================================
        // "Reject the login. Do not allow access. Return a meaningful authentication error."
        // error(401, 'User account not found in HRMS. Please contact your administrator.');
        
        // TODO:
        // After creating the first HRMS administrator:
        // 1. Re-enable employee lookup.
        // 2. Login using the HRMS employee account.
        // 3. Stop using the manually-created Keycloak admin for HRMS.
        return {
            keycloak_sub: keycloak_sub,
            employee_cuid: 'bootstrap-employee',
            employment_cuid: 'bootstrap-employment',
            emp_code: 'BOOTSTRAP',
            employee_name: 'Bootstrap Admin',
            official_email: 'bootstrap@local',
            system_role_cuid: 'bootstrap-role',
            profile_completion_status: 'completed'
        };
    }

    if (!userRow.system_role_cuid) {
        // "If system_role_cuid is null: Reject login. Return: User has not yet been assigned a system role."
        error(403, 'User has not yet been assigned a system role.');
    }

    const employee_name = [userRow.first_name, userRow.last_name].filter(Boolean).join(' ');

    return {
        keycloak_sub: userRow.keycloak_sub,
        employee_cuid: userRow.employee_cuid,
        employment_cuid: userRow.employment_cuid,
        emp_code: userRow.emp_code,
        employee_name: employee_name,
        official_email: userRow.official_email,
        system_role_cuid: userRow.system_role_cuid,
        profile_completion_status: userRow.profile_completion_status
    };
}
