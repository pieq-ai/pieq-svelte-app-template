import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	createLeavePolicy,
	listLeavePolicies
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError } from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';

export const GET: RequestHandler = async () => {
	try {
		const policies = await listLeavePolicies();
		return json({ data: policies });
	} catch (error) {
		console.error('GET /api/leave/policies failed', error);
		return json({ error: 'Failed to retrieve leave policies' }, { status: 500 });
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

	const allowedKeys = [
		'leave_type_cuid',
		'employment_type_cuids',
		'annual_quota',
		'max_per_month',
		'carry_forward_allowed',
		'max_carry_forward_days',
		'requires_document',
		'min_service_days',
		'allow_half_day',
		'gender_specific',
		'applicable_gender',
		'status'
	];

	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ success: false, message: validation.error }, { status: 400 });
	}

	const trimmedBody = trimStringFields(body) as {
		leave_type_cuid?: unknown;
		employment_type_cuids?: unknown;
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

	const {
		leave_type_cuid,
		employment_type_cuids,
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
	} = trimmedBody;

	try {
		const data = await createLeavePolicy({
			leave_type_cuid,
			employment_type_cuids,
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
