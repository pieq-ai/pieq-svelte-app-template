export const AUTH_CALLBACK_PATH = '/auth/callback/keycloak';

export function getOidcUserStorageKey(issuer: string, clientId: string): string {
	return `oidc.user:${issuer}:${clientId}`;
}

export function buildAuthCallbackUrl(appUrl: string): string {
	return `${appUrl.replace(/\/$/, '')}${AUTH_CALLBACK_PATH}`;
}
