import { sequence } from '@sveltejs/kit/hooks';
import { redirect, error } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/server/auth.js';
import * as authUserService from '$lib/server/services/auth-user.service.js';
import { requestContextStorage } from '$lib/server/utils/request-context.js';
import { auditFactory } from '$lib/server/factories/audit.factory.js';
import { createId } from '@paralleldrive/cuid2';

/**
 * Determines if a SvelteKit request is a direct API call from an external client.
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {boolean}
 */
function isApiRequest(event) {
	const pathname = event.url.pathname;
	if (!pathname.startsWith('/api/')) return false;
	if (pathname.includes('/cron')) return false;

	const userAgent = event.request.headers.get('user-agent') || '';
	const hasAuthHeader = event.request.headers.has('authorization');

	// Explicit authorization header always denotes API request
	if (hasAuthHeader) return true;

	// Detect standard programmatic API clients
	const lowerUA = userAgent.toLowerCase();
	if (
		lowerUA.includes('postman') ||
		lowerUA.includes('curl') ||
		lowerUA.includes('insomnia') ||
		lowerUA.includes('axios') ||
		lowerUA.includes('node-fetch') ||
		lowerUA.includes('python-requests')
	) {
		return true;
	}

	// Browser Svelte app fetches typically send referer/origin or sec-fetch-site headers.
	// If these are missing on an API endpoint, classify it as direct API client access.
	const secFetchSite = event.request.headers.get('sec-fetch-site');
	const referer = event.request.headers.get('referer');
	const origin = event.request.headers.get('origin');

	if (!secFetchSite && !referer && !origin) {
		return true;
	}

	return false;
}

/** @type {import('@sveltejs/kit').Handle} */
const auditContextHandle = async ({ event, resolve }) => {
	const ipAddress = event.getClientAddress ? event.getClientAddress() : undefined;
	const userAgent = event.request.headers.get('user-agent') || undefined;
	const requestId = createId();

	/** @type {'USER' | 'SYSTEM' | 'CRON' | 'API'} */
	let performedByType = 'USER';
	if (event.url.pathname.includes('/cron')) {
		performedByType = 'CRON';
	} else if (isApiRequest(event)) {
		performedByType = 'API';
	}

	/** @type {import('$lib/server/utils/request-context').RequestContext} */
	const context = {
		performedBy: undefined,
		performedByType,
		ipAddress,
		userAgent,
		requestId
	};

	if (context.performedByType === 'CRON') {
		context.performedBy = 'Scheduled Cron Job';
	} else if (context.performedByType === 'API') {
		context.performedBy = 'API Client';
	}

	return requestContextStorage.run(context, async () => {
		return await resolve(event);
	});
};


if (typeof BigInt !== 'undefined') {
	BigInt.prototype.toJSON = function () {
		return this.toString();
	};
}

/** @type {import('@sveltejs/kit').Handle} */
const injectLocals = async ({ event, resolve }) => {
	const session = await event.locals.auth?.();
	if (session?.user?.id) {
		let hrmsContext;
		/** @type {string[]} */
		let permissions = [];

		try {
			hrmsContext = await authUserService.syncAuthenticatedUser(session.user.id, session.user.email ?? undefined, session.user.name ?? undefined);
			if (hrmsContext) {
				permissions = hrmsContext.permissions || [];
			}
		} catch (err) {
			console.error('[HOOKS] Error fetching HRMS context/permissions:', err);
			event.locals.user = null;
			event.locals.roles = [];
			
			const errMsg = err instanceof Error ? err.message : String(err);
			await auditFactory.loginFailed(session.user.id, `Authorization failed during user synchronization: ${errMsg}`)
				.catch(e => console.error('[HOOKS] Failed to write failed audit log:', e));

			throw error(403, 'Authorization failed: Could not sync user context');
		}

		event.locals.user = {
			id: session.user.id,
			email: session.user.email ?? '',
			name: session.user.name ?? null,
			...hrmsContext,
			permissions,
			idToken: session.oidcUser?.id_token
		};
		event.locals.roles = session.roles ?? [];

		const reqContext = requestContextStorage.getStore();
		if (reqContext) {
			reqContext.performedBy = event.locals.user.employee_cuid || event.locals.user.id || session.user.id;
			if (reqContext.performedByType !== 'API' && reqContext.performedByType !== 'CRON') {
				reqContext.performedByType = 'USER';
			}
		}
	} else {
		event.locals.user = null;
		event.locals.roles = [];
	}

	return resolve(event);
};

/** @type {import('@sveltejs/kit').Handle} */
const routeGuard = async ({ event, resolve }) => {
	const protectedRoutes = [
		'/employees',
		'/departments',
		'/designations',
		'/system-roles',
		'/permissions',
		'/role-permissions',
		'/dashboard',
		'/salary-components',
		'/roles',
		'/shifts',
		'/organization_locations',
		'/organization_location',
		'/settings',
		'/shift-assignments',
		'/salary-structures',
		'/payrolls',
		'/payroll-records',
		'/leaves',
		'/leave-types',
		'/leave-policies',
		'/holidays',
		'/attendance',
		'/attendance-records'
	];
	const isProtectedRoute = protectedRoutes.some(
		(path) => event.url.pathname === path || event.url.pathname.startsWith(`${path}/`)
	);

	if (isProtectedRoute && !event.locals.user) {
		const callbackUrl = encodeURIComponent(event.url.pathname + event.url.search);
		redirect(303, `/?callbackUrl=${callbackUrl}`);
	}

	const isApiRoute = event.url.pathname.startsWith('/api/');
	const publicApiRoutes = ['/api/notifications/cron'];
	const isPublicApi = publicApiRoutes.some(path => event.url.pathname === path || event.url.pathname.startsWith(`${path}/`));

	if (isApiRoute && !isPublicApi && !event.locals.user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (event.url.pathname === '/' && event.locals.user) {
		redirect(303, '/dashboard');
	}

	return resolve(event);
};


/** @type {import('@sveltejs/kit').Handle} */
const errorHandler = async ({ event, resolve }) => {
	const response = await resolve(event);

	if (event.url.pathname.startsWith('/api/') && response.status >= 400) {
		try {
			const cloned = response.clone();
			const json = await cloned.json();
			const rawError = json.data?.error || json.error || json.message || '';
			const field = json.data?.field || json.field;

			const isDatabaseError = typeof rawError === 'string' && (
				rawError.toLowerCase().includes('prisma') ||
				rawError.toLowerCase().includes('sql') ||
				rawError.toLowerCase().includes('database') ||
				rawError.toLowerCase().includes('constraint') ||
				rawError.toLowerCase().includes('invocation') ||
				rawError.toLowerCase().includes('column') ||
				rawError.toLowerCase().includes('relation') ||
				rawError.toLowerCase().includes('table')
			);

			let sanitizedMessage = rawError;
			let status = response.status;
			let actualField = field;

			if (isDatabaseError) {
				// Log detailed technical error only on server side
				console.error('Detailed Server Database Error:', rawError);

				if (rawError.toLowerCase().includes('unique constraint') || rawError.includes('P2002')) {
					sanitizedMessage = 'A record with this unique value already exists.';
					status = 409;
				} else if (rawError.toLowerCase().includes('too long') || rawError.toLowerCase().includes('value too long') || rawError.includes('P2000')) {
					sanitizedMessage = 'The provided value exceeds the maximum length allowed.';
					status = 400;
				} else {
					sanitizedMessage = 'An internal database error occurred.';
					status = 500;
				}
			}

			return new Response(
				JSON.stringify({
					data: {
						error: sanitizedMessage,
						field: actualField
					}
				}),
				{
					status,
					headers: {
						'content-type': 'application/json'
					}
				}
			);
		} catch (e) {
			return response;
		}
	}

	return response;
};

export const handle = sequence(auditContextHandle, authHandle, injectLocals, routeGuard, errorHandler);

