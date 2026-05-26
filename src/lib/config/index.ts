import type { AppConfig, OidcConfig } from '$lib/types/config';

export interface ApiConfig {
	baseURL: string;
}

let apiConfigCache: ApiConfig | null = null;

function readRuntimeConfig(): AppConfig | undefined {
	if (typeof window === 'undefined') {
		return undefined;
	}

	return window.__PIEQ_CONFIG__;
}

export function loadConfig(): ApiConfig {
	if (apiConfigCache) {
		return apiConfigCache;
	}

	const runtimeBaseURL = readRuntimeConfig()?.apiBaseUrl ?? '';
	apiConfigCache = { baseURL: runtimeBaseURL };
	return apiConfigCache;
}

export function getApiConfig(): ApiConfig {
	return apiConfigCache ?? loadConfig();
}

export function getOidcConfig(): OidcConfig | undefined {
	return readRuntimeConfig()?.oidc;
}

export function getAppUrl(): string {
	return readRuntimeConfig()?.appUrl ?? '';
}

/** Clears client config cache (for tests). */
export function clearClientConfigCache(): void {
	apiConfigCache = null;
}
