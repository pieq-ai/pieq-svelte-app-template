import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getLeaveTypeByCuid,
	updateLeaveType,
	LeaveValidationError
} from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const type = await getLeaveTypeByCuid(id);
		if (!type) {
			return json({ error: 'Leave type not found' }, { status: 404 });
		}

		return json({ data: type });
	} catch (error) {
		console.error(`GET /api/leave/types/${id} failed`, error);
		return json({ error: 'Failed to retrieve leave type' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({
			success: false,
			message: 'Request body must be valid JSON'
		}, { status: 400 });
	}

	const allowedKeys = ['leave_name', 'leave_code', 'description', 'is_paid', 'requires_approval', 'status'];

	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ success: false, message: validation.error }, { status: 400 });
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
		return json({
			success: true,
			message: 'Leave type updated successfully',
			data
		});
	} catch (error) {
		if (error instanceof LeaveValidationError) {
			return json({
				success: false,
				message: error.message,
				field: error.field
			}, { status: 400 });
		}

		console.error(`PUT /api/leave/types/${id} failed`, error);
		return json({
			success: false,
			message: 'Failed to update leave type'
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const existing = await getLeaveTypeByCuid(id);
		if (!existing) {
			return json({
				success: false,
				message: 'Leave type not found'
			}, { status: 404 });
		}

		const updated = await updateLeaveType(id, {
			status: !existing.status
		});

		return json({
			success: true,
			message: updated.status ? 'Leave type reactivated successfully' : 'Leave type deactivated successfully',
			data: updated
		});
	} catch (error) {
		console.error(`DELETE /api/leave/types/${id} failed`, error);
		return json({
			success: false,
			message: 'Failed to delete leave type'
		}, { status: 500 });
	}
};
