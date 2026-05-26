import 'dotenv/config';

/** @typedef {import('$lib/types/config').AppConfig} AppConfig */

const appUrlFromEnv = process.env.APP_URL?.trim();
if (appUrlFromEnv) {
	process.env.AUTH_URL = appUrlFromEnv;
}

/** @param {string} url */
export function normalizeAppUrl(url) {
	return url.replace(/\/$/, '');
}

/** @param {string} url @param {string} realm */
export function buildIssuer(url, realm) {
	const base = url.endsWith('/') ? url : `${url}/`;
	return `${base}realms/${realm}`;
}

/** @param {string | undefined} value @param {string} name */
function requireEnv(value, name) {
	const trimmed = value?.trim();
	if (!trimmed) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return trimmed;
}

/** @type {AppConfig | null} */
let appConfigCache = null;

/** @returns {AppConfig} */
export function getAppConfig() {
	if (appConfigCache) {
		return appConfigCache;
	}

	const apiBaseUrl = requireEnv(process.env.API_BASE_URL, 'API_BASE_URL');
	const appUrl = normalizeAppUrl(requireEnv(process.env.APP_URL, 'APP_URL'));
	const url = requireEnv(process.env.OIDC_URL, 'OIDC_URL');
	const realm = requireEnv(process.env.OIDC_REALM, 'OIDC_REALM');
	const clientId = requireEnv(process.env.OIDC_CLIENT_ID, 'OIDC_CLIENT_ID');

	process.env.AUTH_URL = appUrl;

	appConfigCache = {
		apiBaseUrl,
		appUrl,
		oidc: {
			url,
			realm,
			clientId,
			issuer: buildIssuer(url, realm)
		}
	};

	return appConfigCache;
}

/** @returns {{ clientId: string, clientSecret: string, issuer: string }} */
export function getAuthConfig() {
	const { oidc } = getAppConfig();
	const clientSecret = requireEnv(process.env.OIDC_CLIENT_SECRET, 'OIDC_CLIENT_SECRET');

	return {
		clientId: oidc.clientId,
		clientSecret,
		issuer: oidc.issuer
	};
}

/** Clears cached config (for tests). */
export function clearConfigCache() {
	appConfigCache = null;
}
