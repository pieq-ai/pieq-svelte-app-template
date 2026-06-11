import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	createLeaveType,
	listLeaveTypes,
	LeaveValidationError,
	LeaveMultiValidationError
} from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	createSuccessResponse,
	formatLeaveType
} from '$lib/server/response.js';

export const GET: RequestHandler = async () => {
	try {
		const types = await listLeaveTypes();
		const formattedTypes = types.map(formatLeaveType);
		return successResponse(formattedTypes);
	} catch (error) {
		console.error('GET /api/leave/types failed', error);
		return errorResponse('Failed to retrieve leave types', 500);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return errorResponse('Request body must be valid JSON', 400);
	}

	const allowedKeys = ['leave_name', 'leave_code', 'description', 'is_paid', 'requires_approval', 'status'];

	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return errorResponse(validation.error, 400);
	}

	const trimmedBody = trimStringFields(body) as {
		leave_name?: unknown;
		leave_code?: unknown;
		description?: unknown;
		is_paid?: unknown;
		requires_approval?: unknown;
		status?: unknown;
	};

	const { leave_name, leave_code, description, is_paid, requires_approval, status } = trimmedBody;

	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const data = await createLeaveType({
			leave_name,
			leave_code,
			description,
			is_paid,
			requires_approval,
			status,
			created_by: userId,
			updated_by: userId
		});
		return createSuccessResponse('Leave type', data.cuid);
	} catch (error) {
		const isMultiError =
			error instanceof LeaveMultiValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'LeaveMultiValidationError');

		if (isMultiError) {
			return json({ error: (error as any).fields }, { status: 400 });
		}
		if (error instanceof LeaveValidationError) {
			return json({ error: { [error.field || 'general']: error.message } }, { status: 400 });
		}

		console.error('POST /api/leave/types failed', error);
		return errorResponse('Failed to create leave type', 500);
	}
};
