import { requirePermission } from '$lib/server/guards/permission.guard';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	createHoliday,
	HolidayValidationError,
	HolidayMultiValidationError,
	listHolidays
} from '$lib/server/services/holiday.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	createSuccessResponse,
	formatHoliday
} from '$lib/server/response.js';

export const GET: RequestHandler = async ({ locals }) => {
	requirePermission(locals.user, 'holidays:view');
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
	requirePermission(locals.user, 'holidays:create');
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

		const holiday = await createHoliday({
			name,
			date,
			type,
			created_by: userId,
			updated_by: userId
		});
		return createSuccessResponse('Holiday', holiday.cuid);
	} catch (error) {
		const isMultiError =
			error instanceof HolidayMultiValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'HolidayMultiValidationError');

		if (isMultiError) {
			const fields = (error as any).fields;
			const isConflict = Object.values(fields).some((msg: any) => String(msg).toLowerCase().includes('already exists') || String(msg).toLowerCase().includes('already scheduled'));
			return json({ data: { error: fields } }, { status: isConflict ? 409 : 400 });
		}
		if (error instanceof HolidayValidationError) {
			return json({ data: { error: { [error.field]: error.message } } }, { status: 400 });
		}

		console.error('POST /api/holidays failed', error);
		return errorResponse('Failed to create holiday', 500);
	}
};
