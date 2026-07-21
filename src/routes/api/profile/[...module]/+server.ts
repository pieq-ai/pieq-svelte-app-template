import { error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { extractEditableFields, isFieldEditable } from '$lib/config/profile.config';

import * as personalRoute from '../../employees/[cuid]/+server.js';
import * as addressesRoute from '../../employees/[cuid]/addresses/+server.js';
import * as bankDetailsRoute from '../../employees/[cuid]/bank-details/+server.js';
import * as documentsRoute from '../../employees/[cuid]/documents/+server.js';
import * as documentFileRoute from '../../employees/[cuid]/documents/[docCuid]/+server.js';
import * as educationsRoute from '../../employees/[cuid]/educations/+server.js';
import * as employmentRoute from '../../employees/[cuid]/employment/+server.js';
import * as experiencesRoute from '../../employees/[cuid]/experiences/+server.js';
import * as languagesRoute from '../../employees/[cuid]/languages/+server.js';
import * as skillsRoute from '../../employees/[cuid]/skills/+server.js';

const routes: Record<string, any> = {
	'personal': personalRoute,
	'addresses': addressesRoute,
	'bank-details': bankDetailsRoute,
	'documents': documentsRoute,
	'educations': educationsRoute,
	'employment': employmentRoute,
	'experiences': experiencesRoute,
	'languages': languagesRoute,
	'skills': skillsRoute
};

function getEmployeeCuid(event: RequestEvent) {
	const cuid = event.locals.user?.employee_cuid;
	if (!cuid) throw error(400, 'User is not linked to an employee profile');
	return cuid;
}

async function dispatch(event: RequestEvent, method: 'GET' | 'PUT' | 'POST') {
	permissionGuard.requirePermission(event.locals.user, 'profile:view');
	const cuid = getEmployeeCuid(event);
	let moduleName = event.params.module || 'personal';
	let docCuid: string | undefined;

	if (moduleName.startsWith('documents/') && method === 'GET') {
		docCuid = moduleName.split('/')[1];
		moduleName = 'documents-file';
	}

	let route = routes[moduleName];
	if (moduleName === 'documents-file') {
		route = documentFileRoute;
	}

	if (!route || !route[method]) {
		throw error(404, 'Module not found');
	}

	let request = event.request;

	if (method === 'PUT' || method === 'POST') {
		if (moduleName === 'bank-details' && !isFieldEditable('self', 'bank_details')) {
			throw error(403, 'Bank details cannot be modified by employee');
		}

		const body = await request.json();
		let sanitizedBody = body;
		
		if (moduleName === 'personal' || moduleName === 'employment') {
			sanitizedBody = extractEditableFields('self', body, moduleName);
		}
		
		request = new Request(request.url, {
			method: request.method,
			headers: request.headers,
			body: JSON.stringify(sanitizedBody)
		});
	}

	// Mock the event to inject the employee_cuid and grant employee:view permission
	// This safely reuses the employee management endpoints while enforcing self-service constraints.
	const mockEvent = {
		...event,
		request,
		params: { 
			...event.params, 
			cuid,
			...(docCuid ? { docCuid } : {})
		},
		locals: {
			...event.locals,
			user: {
				...event.locals.user,
				permissions: [...(event.locals.user?.permissions || []), 'employee:view']
			}
		}
	} as RequestEvent;

	return route[method](mockEvent);
}

export async function GET(event: RequestEvent) {
	return dispatch(event, 'GET');
}

export async function PUT(event: RequestEvent) {
	return dispatch(event, 'PUT');
}

export async function POST(event: RequestEvent) {
	return dispatch(event, 'POST');
}
