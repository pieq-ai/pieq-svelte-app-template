import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/server/auth.js';

/** @type {import('@sveltejs/kit').Handle} */
const customAuthHandle = async ({ event, resolve }) => {
	if (event.url.pathname === '/auth/signin' && event.request.method === 'GET') {
		event.locals.auth = async () => null;
		event.locals.getSession = async () => null;
		return resolve(event);
	}
	return authHandle({ event, resolve });
};

/** @type {import('@sveltejs/kit').Handle} */
const injectLocals = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	
	// Skip fetching session for auth endpoints, or static files
	const isAuth = pathname.startsWith('/auth/');
	
	if (!isAuth) {
		const session = await event.locals.auth?.();
		event.locals.session = session;

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
	} else {
		event.locals.user = null;
		event.locals.roles = [];
		event.locals.session = null;
	}

	return resolve(event);
};

/** @type {import('@sveltejs/kit').Handle} */
const routeGuard = async ({ event, resolve }) => {
	const protectedPaths = [
		'/dashboard',
		'/salary-components',
		'/leave-types',
		'/leave-policies',
		'/holidays',
		'/settings',
		'/employees',
		'/departments',
		'/department',
		'/designations',
		'/designation',
		'/system-roles',
		'/permissions',
		'/role-permissions',
	];
	const pathname = event.url.pathname;
	const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

	if (isProtected && !event.locals.user) {
		throw redirect(303, '/auth/signin');
	}

	return resolve(event);
};

export const handle = sequence(customAuthHandle, injectLocals, routeGuard);
