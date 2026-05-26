import { getOidcUserStorageKey } from '$lib/constants';
import type { OidcUserStorage } from '$lib/types/oidc';

export function storeOidcUser(issuer: string, clientId: string, user: OidcUserStorage): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(getOidcUserStorageKey(issuer, clientId), JSON.stringify(user));
}

export function getOidcUser(issuer: string, clientId: string): OidcUserStorage | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	const raw = localStorage.getItem(getOidcUserStorageKey(issuer, clientId));

	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as OidcUserStorage;
	} catch {
		return null;
	}
}

export function clearOidcUser(issuer: string, clientId: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.removeItem(getOidcUserStorageKey(issuer, clientId));
}

export function clearStoredOidcUser(): void {
	const oidc = typeof window !== 'undefined' ? window.__PIEQ_CONFIG__?.oidc : undefined;

	if (!oidc) {
		return;
	}

	clearOidcUser(oidc.issuer, oidc.clientId);
}

export function getAccessToken(): string | null {
	const oidc = typeof window !== 'undefined' ? window.__PIEQ_CONFIG__?.oidc : undefined;

	if (!oidc) {
		return null;
	}

	return getOidcUser(oidc.issuer, oidc.clientId)?.access_token ?? null;
}
