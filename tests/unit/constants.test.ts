import { describe, expect, it } from 'vitest';
import { AUTH_CALLBACK_PATH, buildAuthCallbackUrl } from '$lib/constants';

describe('constants', () => {
	it('buildAuthCallbackUrl builds Keycloak callback from app origin', () => {
		expect(buildAuthCallbackUrl('http://localhost:5173')).toBe(
			`http://localhost:5173${AUTH_CALLBACK_PATH}`
		);
		expect(buildAuthCallbackUrl('https://preprod.app.pieq.ai/')).toBe(
			`https://preprod.app.pieq.ai${AUTH_CALLBACK_PATH}`
		);
		expect(buildAuthCallbackUrl('https://app.pieq.ai')).toBe(
			`https://app.pieq.ai${AUTH_CALLBACK_PATH}`
		);
	});
});
