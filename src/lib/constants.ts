export const AUTH_CALLBACK_PATH = '/auth/callback/keycloak';

export function getOidcUserStorageKey(issuer: string, clientId: string): string {
	return `oidc.user:${issuer}:${clientId}`;
}

export function buildAuthCallbackUrl(appUrl: string): string {
	return `${appUrl.replace(/\/$/, '')}${AUTH_CALLBACK_PATH}`;
}

export const UI_CONSTANTS = {
	EMPTY_STATE_MESSAGE: 'No Records Found',
	BUTTON_SAVE: 'Save',
	BUTTON_UPDATE: 'Save',
	BUTTON_CANCEL: 'Cancel',
	BUTTON_SAVING: 'Saving...',
	VALIDATION_ERROR_COLOR: '#dc2626'
};
