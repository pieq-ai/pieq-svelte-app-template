import { getApiConfig, loadConfig } from '$lib/config';

let initPromise: Promise<void> | null = null;

/**
 * Ensures runtime config is loaded before API calls.
 */
export async function ensureApiInitialized(): Promise<void> {
	if (initPromise) {
		return initPromise;
	}

	initPromise = (async () => {
		loadConfig();
		const { baseURL } = getApiConfig();

		if (!baseURL) {
			throw new Error('API base URL is not configured. Set window.__PIEQ_CONFIG__.apiBaseUrl.');
		}
	})();

	return initPromise;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	await ensureApiInitialized();
	const { baseURL } = getApiConfig();
	const url = new URL(path, baseURL).toString();

	const response = await fetch(url, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include'
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

export const api = {
	get: <T>(path: string) => request<T>('GET', path),
	post: <T>(path: string, data?: unknown) => request<T>('POST', path, data),
	put: <T>(path: string, data?: unknown) => request<T>('PUT', path, data),
	delete: <T>(path: string) => request<T>('DELETE', path)
};
