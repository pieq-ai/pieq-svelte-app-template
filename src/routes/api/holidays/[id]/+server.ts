import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getHolidayByCuid,
	updateHoliday,
	deleteHoliday,
	HolidayValidationError
} from '$lib/server/services/holiday.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const holiday = await getHolidayByCuid(id);
		if (!holiday) {
			return json({ error: 'Holiday not found' }, { status: 404 });
		}
		const formattedHoliday = {
			...holiday,
			holiday_date: holiday.holiday_date.toISOString().split('T')[0]
		};
		return json({ data: formattedHoliday });
	} catch (error) {
		console.error(`GET /api/holidays/${id} failed`, error);
		return json({ error: 'Failed to retrieve holiday' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { id } = params;
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
		const holiday = await updateHoliday(id, { holiday_name, holiday_date, holiday_type });
		const formattedHoliday = {
			...holiday,
			holiday_date: holiday.holiday_date.toISOString().split('T')[0]
		};
		return json({
			success: true,
			message: 'Holiday updated successfully',
			data: formattedHoliday
		});
	} catch (error) {
		if (error instanceof HolidayValidationError) {
			return json({ success: false, message: error.message, field: error.field }, { status: 400 });
		}

		console.error(`PUT /api/holidays/${id} failed`, error);
		return json({ success: false, message: 'Failed to update holiday' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const holiday = await deleteHoliday(id);
		const formattedHoliday = {
			...holiday,
			holiday_date: holiday.holiday_date.toISOString().split('T')[0]
		};
		return json({
			success: true,
			message: 'Holiday deleted successfully',
			data: formattedHoliday
		});
	} catch (error) {
		console.error(`DELETE /api/holidays/${id} failed`, error);
		return json({ success: false, message: 'Failed to delete holiday' }, { status: 500 });
	}
};
