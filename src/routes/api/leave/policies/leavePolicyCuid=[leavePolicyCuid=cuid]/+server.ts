import type { RequestHandler } from './$types.js';
import {
	getLeavePolicyByCuid,
	updateLeavePolicy
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError } from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	updateSuccessResponse,
	deleteSuccessResponse,
	formatLeavePolicy
} from '$lib/server/response.js';

export const GET: RequestHandler = async ({ params }) => {
	const { leavePolicyCuid } = params;

	try {
		const policy = await getLeavePolicyByCuid(leavePolicyCuid);
		if (!policy) {
			return errorResponse('Leave policy not found', 404);
		}

		return successResponse(formatLeavePolicy(policy));
	} catch (error) {
		console.error(`GET /api/leave/policies/leavePolicyCuid=${leavePolicyCuid} failed`, error);
		return errorResponse('Failed to retrieve leave policy', 500);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { leavePolicyCuid } = params;
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

	console.log(`PUT /api/leave/policies/leavePolicyCuid=${leavePolicyCuid} request payload:`, trimmedBody);

	try {
		const data = await updateLeavePolicy(leavePolicyCuid, {
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
		console.log(`PUT /api/leave/policies/leavePolicyCuid=${leavePolicyCuid} success, updated policy:`, data);
		return updateSuccessResponse('Leave policy', data.cuid);
	} catch (error) {
		console.error(`PUT /api/leave/policies/leavePolicyCuid=${leavePolicyCuid} failed. Full error stack:`, error);

		const isValidationError =
			error instanceof LeaveValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'LeaveValidationError');

		if (isValidationError) {
			const valError = error as { field?: string; message: string };
			console.log('Validation failed:', { field: valError.field, message: valError.message });
			return errorResponse(valError.message, 400, valError.field);
		}

		const errMsg = error instanceof Error ? error.message : 'Unknown server error';
		return errorResponse(`Failed to update leave policy: ${errMsg}`, 500);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { leavePolicyCuid } = params;

	try {
		const existing = await getLeavePolicyByCuid(leavePolicyCuid);
		if (!existing) {
			return errorResponse('Leave policy not found', 404);
		}

		const updated = await updateLeavePolicy(leavePolicyCuid, {
			status: !existing.status
		});

		const message = updated.status ? 'Leave policy reactivated successfully' : 'Leave policy deactivated successfully';
		return deleteSuccessResponse('Leave policy', updated.cuid, message);
	} catch (error) {
		console.error(`DELETE /api/leave/policies/leavePolicyCuid=${leavePolicyCuid} failed`, error);
		return errorResponse('Failed to delete leave policy', 500);
	}
};
