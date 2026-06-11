import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getLeaveTypeByCuid,
	updateLeaveType,
	LeaveValidationError,
	LeaveMultiValidationError
} from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	updateSuccessResponse,
	deleteSuccessResponse,
	formatLeaveType
} from '$lib/server/response.js';

export const GET: RequestHandler = async ({ params }) => {
	const { cuid } = params;

	try {
		const type = await getLeaveTypeByCuid(cuid);
		if (!type) {
			return errorResponse('Leave type not found', 404);
		}
		return successResponse(formatLeaveType(type));
	} catch (error) {
		console.error(`GET /api/leave/types/${cuid} failed`, error);
		return errorResponse('Failed to retrieve leave type', 500);
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { cuid } = params;
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

		const data = await updateLeaveType(cuid, {
			leave_name,
			leave_code,
			description,
			is_paid,
			requires_approval,
			status,
			updated_by: userId
		});
		return updateSuccessResponse('Leave type', data.cuid);
	} catch (error) {
		if (error instanceof LeaveMultiValidationError) {
			return json({ data: { error: 'Validation failed', errors: error.fields } }, { status: 400 });
		}
		if (error instanceof LeaveValidationError) {
			return errorResponse(error.message, 400, error.field);
		}

		console.error(`PUT /api/leave/types/${cuid} failed`, error);
		return errorResponse('Failed to update leave type', 500);
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { cuid } = params;

	try {
		const existing = await getLeaveTypeByCuid(cuid);
		if (!existing) {
			return errorResponse('Leave type not found', 404);
		}

		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const updated = await updateLeaveType(cuid, {
			status: !existing.status,
			updated_by: userId
		});

		const message = updated.status ? 'Leave type reactivated successfully' : 'Leave type deactivated successfully';
		return deleteSuccessResponse('Leave type', updated.cuid, message);
	} catch (error) {
		console.error(`DELETE /api/leave/types/${cuid} failed`, error);
		return errorResponse('Failed to delete leave type', 500);
	}
};
