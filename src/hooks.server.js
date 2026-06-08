import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/server/auth.js';

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
		'/department',
		'/designations',
		'/designation',
		'/system-roles',
		'/permissions',
		'/role-permissions',
		'/dashboard',
		'/salary-components',
		'/settings'
	];
	const isProtectedRoute = protectedRoutes.some(
		(path) => event.url.pathname === path || event.url.pathname.startsWith(`${path}/`)
	);

	if (isProtectedRoute && !event.locals.user) {
		const callbackUrl = encodeURIComponent(event.url.pathname + event.url.search);
		redirect(303, `/auth/signin?callbackUrl=${callbackUrl}`);
	}

	if (event.url.pathname === '/auth/signin' && event.locals.user) {
		redirect(303, '/dashboard');
	}

	return resolve(event);
};

/** @type {import('@sveltejs/kit').Handle} */
const customAuthHandle = async ({ event, resolve }) => {
	// Root Cause Fix: Bypass Auth.js interception for the custom sign-in page.
	// If we don't, Auth.js intercepts /auth/signin and infinitely redirects to itself.
	if (event.url.pathname === '/auth/signin' && event.request.method === 'GET') {
		const originalPathname = event.url.pathname;
		// Trick Auth.js into ignoring this route by changing the pathname
		event.url.pathname = '/_bypass_auth_signin';

		return authHandle({
			event,
			resolve: (ev) => {
				// Restore original pathname before downstream hooks or SvelteKit routing run
				ev.url.pathname = originalPathname;
				return resolve(ev);
			}
		});
	}
	return authHandle({ event, resolve });
};

export const handle = sequence(customAuthHandle, injectLocals, routeGuard);
