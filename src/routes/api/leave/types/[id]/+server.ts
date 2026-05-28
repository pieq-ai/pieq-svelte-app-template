import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getLeaveTypeByUuid,
	updateLeaveType,
	LeaveValidationError
} from '$lib/server/services/leave-type.service.js';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const type = await getLeaveTypeByUuid(id);
		if (!type) {
			return json({
				success: false,
				message: 'Leave type not found'
			}, { status: 404 });
		}

		return json({
			success: true,
			message: 'Leave type retrieved successfully',
			data: type
		});
	} catch (error) {
		console.error(`GET /api/leave/types/${id} failed`, error);
		return json({
			success: false,
			message: 'Failed to retrieve leave type'
		}, { status: 500 });
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

	const { leave_name, leave_code, description, is_paid, requires_approval, status } = (body ?? {}) as {
		leave_name?: unknown;
		leave_code?: unknown;
		description?: unknown;
		is_paid?: unknown;
		requires_approval?: unknown;
		status?: unknown;
	};

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
