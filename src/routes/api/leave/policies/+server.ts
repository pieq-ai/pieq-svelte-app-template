import type { RequestHandler } from './$types.js';
import {
	createLeavePolicy,
	listLeavePolicies
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError } from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	createSuccessResponse,
	formatLeavePolicy
} from '$lib/server/response.js';

export const GET: RequestHandler = async () => {
	try {
		const policies = await listLeavePolicies();
		const formattedPolicies = policies.map(formatLeavePolicy);
		return successResponse(formattedPolicies);
	} catch (error) {
		console.error('GET /api/leave/policies failed', error);
		return errorResponse('Failed to retrieve leave policies', 500);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return errorResponse('Request body must be valid JSON', 400);
	}

	const allowedKeys = [
		'leave_type_cuid',
		'employment_type_cuids',
		'annual_quota',
		'max_per_month',
		'carry_forward_allowed',
		'max_carry_forward_days',
		'requires_document',
		'document_required_after_days',
		'min_service_days',
		'allow_half_day',
		'gender_specific',
		'applicable_gender',
		'status'
	];

	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return errorResponse(validation.error, 400);
	}

	const trimmedBody = trimStringFields(body) as {
		leave_type_cuid?: unknown;
		employment_type_cuids?: unknown;
		annual_quota?: unknown;
		max_per_month?: unknown;
		carry_forward_allowed?: unknown;
		max_carry_forward_days?: unknown;
		requires_document?: unknown;
		document_required_after_days?: unknown;
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
		document_required_after_days,
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
			document_required_after_days,
			min_service_days,
			allow_half_day,
			gender_specific,
			applicable_gender,
			status
		});
		return createSuccessResponse('Leave policy', data.cuid);
	} catch (error) {
		if (error instanceof LeaveValidationError) {
			return errorResponse(error.message, 400, error.field);
		}

		console.error('POST /api/leave/policies failed', error);
		return errorResponse('Failed to create leave policy', 500);
	}
};
