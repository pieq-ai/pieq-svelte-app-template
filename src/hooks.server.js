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
		'/dashboard'
	];
	const isProtectedRoute = protectedRoutes.some(
		(path) => event.url.pathname === path || event.url.pathname.startsWith(`${path}/`)
	);

	if (isProtectedRoute && !event.locals.user) {
		redirect(303, '/auth/signin');
	}

	return resolve(event);
};

export const handle = sequence(authHandle, injectLocals, routeGuard);
