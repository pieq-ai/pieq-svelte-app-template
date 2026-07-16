import { env } from '$env/dynamic/private';

export interface KeycloakConfig {
    baseUrl: string;
    realm: string;
    clientId: string;
    clientSecret?: string;
    adminUsername?: string;
    adminPassword?: string;
}

export function getKeycloakConfig(): KeycloakConfig {
    const baseUrl = env.KEYCLOAK_BASE_URL || process.env.KEYCLOAK_BASE_URL;
    const realm = env.KEYCLOAK_REALM || process.env.KEYCLOAK_REALM;
    const clientId = env.KEYCLOAK_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID;
    
    if (!baseUrl || !realm || !clientId) {
        throw new Error('Missing fundamental Keycloak configuration (KEYCLOAK_BASE_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID)');
    }

    const clientSecret = env.KEYCLOAK_CLIENT_SECRET || process.env.KEYCLOAK_CLIENT_SECRET;
    const adminUsername = env.KEYCLOAK_ADMIN_USERNAME || process.env.KEYCLOAK_ADMIN_USERNAME;
    const adminPassword = env.KEYCLOAK_ADMIN_PASSWORD || process.env.KEYCLOAK_ADMIN_PASSWORD;

    const hasClientAuth = !!clientSecret;
    const hasPasswordAuth = !!(adminUsername && adminPassword);

    if (!hasClientAuth && !hasPasswordAuth) {
        throw new Error('Missing Keycloak authentication configuration (provide either KEYCLOAK_CLIENT_SECRET or KEYCLOAK_ADMIN_USERNAME and KEYCLOAK_ADMIN_PASSWORD)');
    }

    return {
        baseUrl,
        realm,
        clientId,
        clientSecret,
        adminUsername,
        adminPassword
    };
}
