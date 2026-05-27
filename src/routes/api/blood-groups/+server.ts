import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createBloodGroup,
	deleteBloodGroup,
	BloodGroupValidationError,
	listBloodGroups,
	updateBloodGroup
} from '$lib/server/services/blood-group.service.js';

export const GET: RequestHandler = async () => {
	try {
		const groups = await listBloodGroups();
		return json({ data: groups });
	} catch (error) {
		console.error('GET /api/blood-groups failed', error);
		return json({ error: 'Failed to list blood groups' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	const { blood_group_name } = (body ?? {}) as { blood_group_name?: unknown };

	try {
		const group = await createBloodGroup({ blood_group_name });
		return json({ data: group }, { status: 201 });
	} catch (error) {
		if (error instanceof BloodGroupValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}

		console.error('POST /api/blood-groups failed', error);
		return json({ error: 'Failed to create blood group' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	const { uuid, blood_group_name } = (body ?? {}) as {
		uuid?: unknown;
		blood_group_name?: unknown;
	};

	if (typeof uuid !== 'string' || !uuid) {
		return json({ error: 'uuid is required' }, { status: 400 });
	}

	try {
		const group = await updateBloodGroup(uuid, { blood_group_name });
		return json({ data: group }, { status: 200 });
	} catch (error) {
		if (error instanceof BloodGroupValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}

		console.error('PUT /api/blood-groups failed', error);
		return json({ error: 'Failed to update blood group' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, url }) => {
	let uuid = url.searchParams.get('uuid');

	if (!uuid) {
		try {
			const body = (await request.json()) as { uuid?: unknown };
			if (body && typeof body.uuid === 'string') {
				uuid = body.uuid;
			}
		} catch {
			// Body parse failure ignored if uuid is in query param
		}
	}

	if (!uuid) {
		return json({ error: 'uuid is required' }, { status: 400 });
	}

	try {
		const group = await deleteBloodGroup(uuid);
		return json({ data: group }, { status: 200 });
	} catch (error) {
		console.error('DELETE /api/blood-groups failed', error);
		return json({ error: 'Failed to delete blood group' }, { status: 500 });
	}
};
