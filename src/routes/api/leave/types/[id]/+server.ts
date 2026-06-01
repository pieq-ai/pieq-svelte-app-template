import type { RequestHandler } from './$types.js';
import {
	getLeaveTypeByCuid,
	updateLeaveType,
	LeaveValidationError
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
	const { id } = params;

	try {
		const type = await getLeaveTypeByCuid(id);
		if (!type) {
			return errorResponse('Leave type not found', 404);
		}
		return successResponse(formatLeaveType(type));
	} catch (error) {
		console.error(`GET /api/leave/types/${id} failed`, error);
		return errorResponse('Failed to retrieve leave type', 500);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { id } = params;
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
		const data = await updateLeaveType(id, {
			leave_name,
			leave_code,
			description,
			is_paid,
			requires_approval,
			status
		});
		return updateSuccessResponse('Leave type', data.cuid);
	} catch (error) {
		if (error instanceof LeaveValidationError) {
			return errorResponse(error.message, 400, error.field);
		}

		console.error(`PUT /api/leave/types/${id} failed`, error);
		return errorResponse('Failed to update leave type', 500);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const existing = await getLeaveTypeByCuid(id);
		if (!existing) {
			return errorResponse('Leave type not found', 404);
		}

		const updated = await updateLeaveType(id, {
			status: !existing.status
		});

		const message = updated.status ? 'Leave type reactivated successfully' : 'Leave type deactivated successfully';
		return deleteSuccessResponse('Leave type', updated.cuid, message);
	} catch (error) {
		console.error(`DELETE /api/leave/types/${id} failed`, error);
		return errorResponse('Failed to delete leave type', 500);
	}
};
