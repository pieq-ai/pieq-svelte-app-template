import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	createLeaveType,
	listLeaveTypes,
	LeaveValidationError
} from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';

export const GET: RequestHandler = async () => {
	try {
		const types = await listLeaveTypes();
		return json({ data: types });
	} catch (error) {
		console.error('GET /api/leave/types failed', error);
		return json({ error: 'Failed to retrieve leave types' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
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
		const data = await createLeaveType({
			leave_name,
			leave_code,
			description,
			is_paid,
			requires_approval,
			status
		});
		return json({
			success: true,
			message: 'Leave type created successfully',
			data
		}, { status: 201 });
	} catch (error) {
		if (error instanceof LeaveValidationError) {
			return json({
				success: false,
				message: error.message,
				field: error.field
			}, { status: 400 });
		}

		console.error('POST /api/leave/types failed', error);
		return json({
			success: false,
			message: 'Failed to create leave type'
		}, { status: 500 });
	}
};
