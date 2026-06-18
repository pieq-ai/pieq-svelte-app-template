import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/server/auth.js';

// Polyfill for BigInt JSON serialization to prevent runtime errors
if (typeof BigInt !== 'undefined') {
	// @ts-expect-error - BigInt.prototype.toJSON is not defined in standard TS libs
	BigInt.prototype.toJSON = function () {
		return this.toString();
	};
}

/** @type {import('@sveltejs/kit').Handle} */
const injectLocals = async ({ event, resolve }) => {
	const session = await event.locals.auth?.();

	if (session?.user?.id) {
		event.locals.user = {
			id: session.user.id,
			email: session.user.email ?? '',
			name: session.user.name ?? null
		};
		event.locals.roles = session.roles ?? [];
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
		'/settings',
		'/leave-types',
		'/leave-policies',
		'/holidays'
	];
	const isProtectedRoute = protectedRoutes.some(
		(path) => event.url.pathname === path || event.url.pathname.startsWith(`${path}/`)
	);

	if (isProtectedRoute && !event.locals.user) {
		const callbackUrl = encodeURIComponent(event.url.pathname + event.url.search);
		redirect(303, `/?callbackUrl=${callbackUrl}`);
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

export const handle = sequence(authHandle, injectLocals, routeGuard, errorHandler);
