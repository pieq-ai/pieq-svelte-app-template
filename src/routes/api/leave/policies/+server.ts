import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	createLeavePolicy,
	listLeavePolicies
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError } from '$lib/server/services/leave-type.service.js';

export const GET: RequestHandler = async () => {
	try {
		const policies = await listLeavePolicies();
		return json({
			success: true,
			message: 'Leave policies retrieved successfully',
			data: policies
		});
	} catch (error) {
		console.error('GET /api/leave/policies failed', error);
		return json({
			success: false,
			message: 'Failed to retrieve leave policies'
		}, { status: 500 });
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

	const {
		leave_type_uuid,
		employment_type_uuids,
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
		leave_type_uuid?: unknown;
		employment_type_uuids?: unknown;
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
		const data = await createLeavePolicy({
			leave_type_uuid,
			employment_type_uuids,
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
			message: 'Leave policy created successfully',
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

		console.error('POST /api/leave/policies failed', error);
		return json({
			success: false,
			message: 'Failed to create leave policy'
		}, { status: 500 });
	}
};
