import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createHoliday,
	deleteHoliday,
	HolidayValidationError,
	listHolidays,
	updateHoliday
} from '$lib/server/services/holiday.service.js';

export const GET: RequestHandler = async () => {
	try {
		const holidays = await listHolidays();
		return json({ data: holidays });
	} catch (error) {
		console.error('GET /api/holidays failed', error);
		return json({ error: 'Failed to list holidays' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	const { holiday_name, holiday_date, holiday_type } = (body ?? {}) as {
		holiday_name?: unknown;
		holiday_date?: unknown;
		holiday_type?: unknown;
	};

	try {
		const holiday = await createHoliday({ holiday_name, holiday_date, holiday_type });
		return json({ data: holiday }, { status: 201 });
	} catch (error) {
		if (error instanceof HolidayValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}

		console.error('POST /api/holidays failed', error);
		return json({ error: 'Failed to create holiday' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	const { uuid, holiday_name, holiday_date, holiday_type } = (body ?? {}) as {
		uuid?: unknown;
		holiday_name?: unknown;
		holiday_date?: unknown;
		holiday_type?: unknown;
	};

	if (typeof uuid !== 'string' || !uuid) {
		return json({ error: 'uuid is required' }, { status: 400 });
	}

	try {
		const holiday = await updateHoliday(uuid, { holiday_name, holiday_date, holiday_type });
		return json({ data: holiday }, { status: 200 });
	} catch (error) {
		if (error instanceof HolidayValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}

		console.error('PUT /api/holidays failed', error);
		return json({ error: 'Failed to update holiday' }, { status: 500 });
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
			// Body parse failure is ignored if uuid was expected in query param
		}
	}

	if (!uuid) {
		return json({ error: 'uuid is required' }, { status: 400 });
	}

	try {
		const holiday = await deleteHoliday(uuid);
		return json({ data: holiday }, { status: 200 });
	} catch (error) {
		console.error('DELETE /api/holidays failed', error);
		return json({ error: 'Failed to delete holiday' }, { status: 500 });
	}
};
