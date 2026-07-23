import { findAuthUserByKeycloakSub, hasAnyEmployments, findAuthUserByEmail, updateKeycloakSub } from '$lib/server/dao/auth.dao.js';
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

export async function syncAuthenticatedUser(keycloak_sub: string, email?: string, name?: string): Promise<AuthContext> {
    let userRow = await findAuthUserByKeycloakSub(keycloak_sub);

    if (!userRow) {
        // Bootstrap mode: DB is empty (post migrate reset) — return a synthetic
        // Admin context with wildcard permissions ('*') without writing anything to the DB.
        // The user self-onboards via the app to get their proper PQ-prefixed emp code.
        const dbHasUsers = await hasAnyEmployments();
        if (!dbHasUsers) {
            console.log('[BOOTSTRAP] Empty DB — returning synthetic Admin context with wildcard permissions');
            const emailVal = email || 'bootstrap@local';
            const nameParts = (name ?? emailVal.split('@')[0]).split(' ');
            const firstName = nameParts[0] ?? 'Bootstrap';
            const lastName = nameParts.slice(1).join(' ') || 'Admin';

            return {
                keycloak_sub,
                employee_cuid: 'bootstrap-employee',
                employment_cuid: 'bootstrap-employment',
                emp_code: 'BOOTSTRAP',
                employee_name: `${firstName} ${lastName}`.trim(),
                official_email: emailVal,
                system_role_cuid: 'bootstrap-role-cuid',
                system_role_name: 'Bootstrap Admin',
                profile_completion_status: 'completed',
                permissions: ['*']
            };
        }

        // DB is not empty, but we didn't find the user by keycloak_sub.
        // Try looking up the user by official email to link their keycloak_sub.
        if (email) {
            const userByEmail = await findAuthUserByEmail(email);
            if (userByEmail && !userByEmail.keycloak_sub) {
                console.log(`[AUTH-SYNC] Linking keycloak_sub ${keycloak_sub} to employment ${userByEmail.employment_cuid} matching email ${email}`);
                await updateKeycloakSub(userByEmail.employment_cuid, keycloak_sub);
                userRow = await findAuthUserByKeycloakSub(keycloak_sub);
            }
        }

        if (!userRow) {
            error(403, 'User not found in HRMS database.');
        }
    }

    if (!userRow.system_role_cuid) {
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
        system_role_name: userRow.system_role_name,
        profile_completion_status: userRow.profile_completion_status,
        permissions: userRow.permissions || []
    };
}
