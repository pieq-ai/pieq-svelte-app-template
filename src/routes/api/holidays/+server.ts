import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	createHoliday,
	HolidayValidationError,
	listHolidays
} from '$lib/server/services/holiday.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';

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
		return json({ success: false, message: 'Request body must be valid JSON' }, { status: 400 });
	}

	const validation = validatePayloadKeys(body, ['holiday_name', 'holiday_date', 'holiday_type']);
	if (validation) {
		return json({ success: false, message: validation.error }, { status: 400 });
	}

	const trimmedBody = trimStringFields(body) as {
		holiday_name?: unknown;
		holiday_date?: unknown;
		holiday_type?: unknown;
	};

	const { holiday_name, holiday_date, holiday_type } = trimmedBody;

	try {
		const holiday = await createHoliday({ holiday_name, holiday_date, holiday_type });
		return json({
			success: true,
			message: 'Holiday created successfully',
			data: holiday
		}, { status: 201 });
	} catch (error) {
		if (error instanceof HolidayValidationError) {
			return json({ success: false, message: error.message, field: error.field }, { status: 400 });
		}

		console.error('POST /api/holidays failed', error);
		return json({ success: false, message: 'Failed to create holiday' }, { status: 500 });
	}
};
