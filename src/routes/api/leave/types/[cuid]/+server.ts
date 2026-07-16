import { requirePermission } from '$lib/server/guards/permission.guard';
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
	formatLeaveType
} from '$lib/server/response.js';

export const GET: RequestHandler = async ({ params, locals }) => {
	requirePermission(locals.user, 'leave_type:view');
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
	requirePermission(locals.user, 'leave_type:view');
	const { cuid } = params;
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const allowedKeys = ['name', 'code', 'description', 'is_paid', 'requires_approval', 'status'];

	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const trimmedBody = trimStringFields(body) as {
		name?: unknown;
		code?: unknown;
		description?: unknown;
		is_paid?: unknown;
		requires_approval?: unknown;
		status?: unknown;
	};

	const { name, code, description, is_paid, requires_approval, status } = trimmedBody;

	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const data = await updateLeaveType(cuid, {
			name,
			code,
			description,
			is_paid,
			requires_approval,
			status,
			updated_by: userId
		});
		return updateSuccessResponse('Leave type', data.cuid);
	} catch (error) {
		if (error instanceof Error && error.message === 'Leave type not found') {
			return errorResponse(error.message, 404);
		}

		const isMultiError =
			error instanceof LeaveMultiValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'LeaveMultiValidationError');

		if (isMultiError) {
			const fields = (error as any).fields;
			const isConflict = Object.values(fields).some((msg: any) => String(msg).toLowerCase().includes('already exists'));
			return json({ data: { error: fields } }, { status: isConflict ? 409 : 400 });
		}
		if (error instanceof LeaveValidationError) {
			return json({ data: { error: { [error.field || 'general']: error.message } } }, { status: 400 });
		}

		console.error(`PUT /api/leave/types/${cuid} failed`, error);
		return errorResponse('Failed to update leave type', 500);
	}
};
