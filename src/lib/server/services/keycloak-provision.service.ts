// @ts-expect-error
import { createKeycloakUser, assignInitialRole, triggerOnboardingEmail } from 'pieq-sso-lib';

export interface ProvisionPayload {
    first_name: string;
    last_name: string;
    official_email: string;
    system_role_cuid?: string | null;
}

export async function provisionUser(payload: ProvisionPayload): Promise<string> {
    console.log('Provisioning Started');

    try {
        const response = await createKeycloakUser({
            username: payload.official_email,
            email: payload.official_email,
            firstName: payload.first_name,
            lastName: payload.last_name,
            enabled: true
        });
        
        console.log("Keycloak create user response:", response);
        const keycloak_sub = typeof response === 'string' ? response : (response?.id || response?.sub);
        
        console.log('Keycloak User Created');

        if (payload.system_role_cuid) {
            await assignInitialRole(keycloak_sub, payload.system_role_cuid);
            console.log('Role Assigned');
        }

        await triggerOnboardingEmail(keycloak_sub, ['UPDATE_PASSWORD']);
        console.log('Email Triggered');

        return keycloak_sub;
    } catch (error: any) {
        console.log('Provisioning Failed');
        console.log('Reason:', error?.message || error);
        throw new Error('Unable to provision employee in Keycloak. Employee remains pending. Please retry.', { cause: error });
    }
}
