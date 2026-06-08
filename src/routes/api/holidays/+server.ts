import type { RequestHandler } from './$types.js';
import {
	createHoliday,
	HolidayValidationError,
	listHolidays
} from '$lib/server/services/holiday.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	createSuccessResponse,
	formatHoliday
} from '$lib/server/response.js';

export const GET: RequestHandler = async () => {
	try {
		const holidays = await listHolidays();
		const formattedHolidays = holidays.map(formatHoliday);
		return successResponse(formattedHolidays);
	} catch (error) {
		console.error('GET /api/holidays failed', error);
		return errorResponse('Failed to list holidays', 500);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return errorResponse('Request body must be valid JSON', 400);
	}

	const validation = validatePayloadKeys(body, ['holiday_name', 'holiday_date', 'holiday_type']);
	if (validation) {
		return errorResponse(validation.error, 400);
	}

	const trimmedBody = trimStringFields(body) as {
		holiday_name?: unknown;
		holiday_date?: unknown;
		holiday_type?: unknown;
	};

	const { holiday_name, holiday_date, holiday_type } = trimmedBody;

	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const holiday = await createHoliday({
			holiday_name,
			holiday_date,
			holiday_type,
			created_by: userId,
			updated_by: userId
		});
		return createSuccessResponse('Holiday', holiday.cuid);
	} catch (error) {
		if (error instanceof HolidayValidationError) {
			return errorResponse(error.message, 400, error.field);
		}

		console.error('POST /api/holidays failed', error);
		return errorResponse('Failed to create holiday', 500);
	}
};
