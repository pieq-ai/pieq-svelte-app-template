import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getHolidayByCuid,
	updateHoliday,
	deleteHoliday,
	HolidayValidationError,
	HolidayMultiValidationError
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
	const { cuid } = params;

	try {
		const holiday = await getHolidayByCuid(cuid);
		if (!holiday) {
			return errorResponse('Holiday not found', 404);
		}
		const formattedHoliday = formatHoliday(holiday);
		return successResponse(formattedHoliday);
	} catch (error) {
		console.error(`GET /api/holidays/${cuid} failed`, error);
		return errorResponse('Failed to retrieve holiday', 500);
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { cuid } = params;
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const validation = validatePayloadKeys(body, ['name', 'date', 'type']);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const trimmedBody = trimStringFields(body) as {
		name?: unknown;
		date?: unknown;
		type?: unknown;
	};

	const { name, date, type } = trimmedBody;

	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const holiday = await updateHoliday(cuid, {
			name,
			date,
			type,
			updated_by: userId
		});
		return updateSuccessResponse('Holiday', holiday.cuid);
	} catch (error) {
		const isMultiError =
			error instanceof HolidayMultiValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'HolidayMultiValidationError');

		if (isMultiError) {
			return json({ data: { error: (error as any).fields } }, { status: 400 });
		}
		if (error instanceof HolidayValidationError) {
			return json({ data: { error: { [error.field]: error.message } } }, { status: 400 });
		}

		console.error(`PUT /api/holidays/${cuid} failed`, error);
		return errorResponse('Failed to update holiday', 500);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { cuid } = params;

	try {
		const holiday = await deleteHoliday(cuid);
		return deleteSuccessResponse('Holiday', holiday.cuid);
	} catch (error) {
		console.error(`DELETE /api/holidays/${cuid} failed`, error);
		return errorResponse('Failed to delete holiday', 500);
	}
};
