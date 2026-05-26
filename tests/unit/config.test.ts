import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildIssuer,
	clearConfigCache,
	getAppConfig,
	getAuthConfig,
	normalizeAppUrl
} from '$lib/server/config.js';

const env = {
	API_BASE_URL: 'https://preprod.api.pieq.ai/',
	APP_URL: 'https://preprod.app.pieq.ai/',
	OIDC_URL: 'https://preprod.auth.pieq.ai/',
	OIDC_REALM: 'pieq-sso',
	OIDC_CLIENT_ID: 'pieq-app',
	OIDC_CLIENT_SECRET: 'test-secret'
};

describe('server config', () => {
	beforeEach(() => {
		clearConfigCache();
		vi.stubEnv('API_BASE_URL', env.API_BASE_URL);
		vi.stubEnv('APP_URL', env.APP_URL);
		vi.stubEnv('OIDC_URL', env.OIDC_URL);
		vi.stubEnv('OIDC_REALM', env.OIDC_REALM);
		vi.stubEnv('OIDC_CLIENT_ID', env.OIDC_CLIENT_ID);
		vi.stubEnv('OIDC_CLIENT_SECRET', env.OIDC_CLIENT_SECRET);
	});

	afterEach(() => {
		clearConfigCache();
		vi.unstubAllEnvs();
	});

	it('normalizeAppUrl strips trailing slash', () => {
		expect(normalizeAppUrl('https://preprod.app.pieq.ai/')).toBe('https://preprod.app.pieq.ai');
		expect(normalizeAppUrl('http://localhost:5173')).toBe('http://localhost:5173');
	});

	it('buildIssuer derives Keycloak issuer from url and realm', () => {
		expect(buildIssuer('https://preprod.auth.pieq.ai/', 'pieq-sso')).toBe(
			'https://preprod.auth.pieq.ai/realms/pieq-sso'
		);
		expect(buildIssuer('https://preprod.auth.pieq.ai', 'pieq-sso')).toBe(
			'https://preprod.auth.pieq.ai/realms/pieq-sso'
		);
	});

	it('getAppConfig returns Pieq preprod public config', () => {
		const config = getAppConfig();

		expect(config.apiBaseUrl).toBe(env.API_BASE_URL);
		expect(config.appUrl).toBe('https://preprod.app.pieq.ai');
		expect(config.oidc).toEqual({
			url: env.OIDC_URL,
			realm: env.OIDC_REALM,
			clientId: env.OIDC_CLIENT_ID,
			issuer: 'https://preprod.auth.pieq.ai/realms/pieq-sso'
		});
	});

	it('getAppConfig syncs AUTH_URL for Auth.js', () => {
		getAppConfig();

		expect(process.env.AUTH_URL).toBe('https://preprod.app.pieq.ai');
	});

	it('getAuthConfig returns Auth.js Keycloak settings', () => {
		expect(getAuthConfig()).toEqual({
			clientId: env.OIDC_CLIENT_ID,
			clientSecret: env.OIDC_CLIENT_SECRET,
			issuer: 'https://preprod.auth.pieq.ai/realms/pieq-sso'
		});
	});

	it('getAppConfig throws when OIDC fields are missing', () => {
		vi.stubEnv('OIDC_REALM', '');

		expect(() => getAppConfig()).toThrow('Missing required environment variable: OIDC_REALM');
	});

	it('getAppConfig throws when APP_URL is missing', () => {
		vi.stubEnv('APP_URL', '');

		expect(() => getAppConfig()).toThrow('Missing required environment variable: APP_URL');
	});

	it('getAuthConfig throws when client secret is missing', () => {
		getAppConfig();
		vi.stubEnv('OIDC_CLIENT_SECRET', '');

		expect(() => getAuthConfig()).toThrow('Missing required environment variable: OIDC_CLIENT_SECRET');
	});
});
