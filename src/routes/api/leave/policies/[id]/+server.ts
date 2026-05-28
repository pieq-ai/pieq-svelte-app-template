import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getLeavePolicyByUuid,
	updateLeavePolicy
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError } from '$lib/server/services/leave-type.service.js';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	try {
		const policy = await getLeavePolicyByUuid(id);
		if (!policy) {
			return json({
				success: false,
				message: 'Leave policy not found'
			}, { status: 404 });
		}

		return json({
			success: true,
			message: 'Leave policy retrieved successfully',
			data: policy
		});
	} catch (error) {
		console.error(`GET /api/leave/policies/${id} failed`, error);
		return json({
			success: false,
			message: 'Failed to retrieve leave policy'
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

	const {
		leave_type_id,
		employment_type_ids,
		annual_quota,
		max_per_month,
		carry_forward_allowed,
		max_carry_forward_days,
		requires_document,
		min_service_days,
		allow_half_day,
		gender_specific,
		applicable_gender,
		status
	} = (body ?? {}) as {
		leave_type_id?: unknown;
		employment_type_ids?: unknown;
		annual_quota?: unknown;
		max_per_month?: unknown;
		carry_forward_allowed?: unknown;
		max_carry_forward_days?: unknown;
		requires_document?: unknown;
		min_service_days?: unknown;
		allow_half_day?: unknown;
		gender_specific?: unknown;
		applicable_gender?: unknown;
		status?: unknown;
	};

	try {
		const data = await updateLeavePolicy(id, {
			leave_type_id,
			employment_type_ids,
			annual_quota,
			max_per_month,
			carry_forward_allowed,
			max_carry_forward_days,
			requires_document,
			min_service_days,
			allow_half_day,
			gender_specific,
			applicable_gender,
			status
		});
		return json({
			success: true,
			message: 'Leave policy updated successfully',
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

		console.error(`PUT /api/leave/policies/${id} failed`, error);
		return json({
			success: false,
			message: 'Failed to update leave policy'
		}, { status: 500 });
	}
};
