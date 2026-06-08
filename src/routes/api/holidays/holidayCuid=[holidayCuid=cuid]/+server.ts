import type { RequestHandler } from './$types.js';
import {
	getHolidayByCuid,
	updateHoliday,
	deleteHoliday,
	HolidayValidationError
} from '$lib/server/services/holiday.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	updateSuccessResponse,
	deleteSuccessResponse,
	formatHoliday
} from '$lib/server/response.js';

export const GET: RequestHandler = async ({ params }) => {
	const { holidayCuid } = params;

	try {
		const holiday = await getHolidayByCuid(holidayCuid);
		if (!holiday) {
			return errorResponse('Holiday not found', 404);
		}
		const formattedHoliday = formatHoliday(holiday);
		return successResponse(formattedHoliday);
	} catch (error) {
		console.error(`GET /api/holidays/holidayCuid=${holidayCuid} failed`, error);
		return errorResponse('Failed to retrieve holiday', 500);
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { holidayCuid } = params;
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

		const holiday = await updateHoliday(holidayCuid, {
			holiday_name,
			holiday_date,
			holiday_type,
			updated_by: userId
		});
		return updateSuccessResponse('Holiday', holiday.cuid);
	} catch (error) {
		if (error instanceof HolidayValidationError) {
			return errorResponse(error.message, 400, error.field);
		}

		console.error(`PUT /api/holidays/holidayCuid=${holidayCuid} failed`, error);
		return errorResponse('Failed to update holiday', 500);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { holidayCuid } = params;

	try {
		const holiday = await deleteHoliday(holidayCuid);
		return deleteSuccessResponse('Holiday', holiday.cuid);
	} catch (error) {
		console.error(`DELETE /api/holidays/holidayCuid=${holidayCuid} failed`, error);
		return errorResponse('Failed to delete holiday', 500);
	}
};
