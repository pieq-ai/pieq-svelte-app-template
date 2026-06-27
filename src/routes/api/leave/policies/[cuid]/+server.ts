import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	getLeavePolicyByCuid,
	updateLeavePolicy
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError, LeaveMultiValidationError } from '$lib/server/services/leave-type.service.js';
import { validatePayloadKeys, trimStringFields } from '$lib/server/validation.js';
import {
	successResponse,
	errorResponse,
	updateSuccessResponse,
	deleteSuccessResponse,
	formatLeavePolicy
} from '$lib/server/response.js';

export const GET: RequestHandler = async ({ params }) => {
	const { cuid } = params;

	try {
		const policy = await getLeavePolicyByCuid(cuid);
		if (!policy) {
			return errorResponse('Leave policy not found', 404);
		}

		return successResponse(formatLeavePolicy(policy));
	} catch (error) {
		console.error(`GET /api/leave/policies/${cuid} failed`, error);
		return errorResponse('Failed to retrieve leave policy', 500);
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { cuid } = params;
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: { general: 'Request body must be valid JSON' } }, { status: 400 });
	}

	const allowedKeys = [
		'leave_type_cuid',
		'employment_type_cuids',
		'annual_limit',
		'max_per_month',
		'carry_forward_allowed',
		'max_carry_forward_days',
		'max_annual_carry_forward_days',
		'document_required',
		'document_required_after_days',
		'min_service_days',
		'allow_half_day',
		'gender_specific',
		'applicable_gender',
		'status'
	];

	const validation = validatePayloadKeys(body, allowedKeys);
	if (validation) {
		return json({ error: { general: validation.error } }, { status: 400 });
	}

	const trimmedBody = trimStringFields(body) as {
		leave_type_cuid?: unknown;
		employment_type_cuids?: unknown;
		annual_limit?: unknown;
		max_per_month?: unknown;
		carry_forward_allowed?: unknown;
		max_carry_forward_days?: unknown;
		max_annual_carry_forward_days?: unknown;
		document_required?: unknown;
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
		annual_limit,
		max_per_month,
		carry_forward_allowed,
		max_carry_forward_days,
		max_annual_carry_forward_days,
		document_required,
		document_required_after_days,
		min_service_days,
		allow_half_day,
		gender_specific,
		applicable_gender,
		status
	} = trimmedBody;


	try {
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const data = await updateLeavePolicy(cuid, {
			leave_type_cuid,
			employment_type_cuids,
			annual_limit,
			max_per_month,
			carry_forward_allowed,
			max_carry_forward_days,
			max_annual_carry_forward_days,
			document_required,
			document_required_after_days,
			min_service_days,
			allow_half_day,
			gender_specific,
			applicable_gender,
			status,
			updated_by: userId
		});
		return updateSuccessResponse('Leave policy', data.cuid);
	} catch (error) {
		console.error(`PUT /api/leave/policies/${cuid} failed. Full error stack:`, error);

		const isMultiError =
			error instanceof LeaveMultiValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'LeaveMultiValidationError');

		if (isMultiError) {
			return json({ data: { error: (error as any).fields } }, { status: 400 });
		}

		const isValidationError =
			error instanceof LeaveValidationError ||
			(error !== null && typeof error === 'object' && 'name' in error && error.name === 'LeaveValidationError');

		if (isValidationError) {
			const valError = error as { field?: string; message: string };
			return json({ data: { error: { [valError.field || 'general']: valError.message } } }, { status: 400 });
		}

		const errMsg = error instanceof Error ? error.message : 'Unknown server error';
		return errorResponse(`Failed to update leave policy: ${errMsg}`, 500);
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { cuid } = params;

	try {
		const existing = await getLeavePolicyByCuid(cuid);
		if (!existing) {
			return errorResponse('Leave policy not found', 404);
		}

		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		const updated = await updateLeavePolicy(cuid, {
			status: !existing.status,
			updated_by: userId
		});

		const message = updated.status ? 'Leave policy reactivated successfully' : 'Leave policy deactivated successfully';
		return deleteSuccessResponse('Leave policy', updated.cuid, message);
	} catch (error) {
		console.error(`DELETE /api/leave/policies/${cuid} failed`, error);
		return errorResponse('Failed to delete leave policy', 500);
	}
};
