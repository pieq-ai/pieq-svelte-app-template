import * as leavePolicyDao from '$lib/server/dao/leave-policy.dao.js';
import * as leaveTypeDao from '$lib/server/dao/leave-type.dao.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';
import { LeaveValidationError, LeaveMultiValidationError } from './leave-type.service.js';

export interface CreateLeavePolicyInput {
	leave_type_cuid: unknown;
	employment_type_cuids: unknown;
	annual_limit: unknown;
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
	created_by?: string | null;
	updated_by?: string | null;
}

export interface UpdateLeavePolicyInput {
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
	updated_by?: string | null;
}

async function validateAndMapPolicyInput(
	input: CreateLeavePolicyInput | UpdateLeavePolicyInput,
	excludePolicyCuid?: string
) {
	if (input.leave_type_cuid === undefined || input.leave_type_cuid === null || String(input.leave_type_cuid).trim() === '') {
		throw new LeaveValidationError('leave_type_cuid', 'Leave type is required');
	}
	const leave_type_cuid = String(input.leave_type_cuid).trim();

	const leaveType = await leaveTypeDao.findByCuid(leave_type_cuid);
	if (!leaveType) {
		throw new LeaveValidationError('leave_type_cuid', 'Selected leave type does not exist');
	}
	if (!leaveType.status) {
		throw new LeaveValidationError('leave_type_cuid', 'Selected leave type is inactive');
	}

	if (input.employment_type_cuids === undefined || input.employment_type_cuids === null) {
		throw new LeaveValidationError('employment_type_cuids', 'At least one employment type is required');
	}

	let rawEmploymentTypeCuids: string[];
	if (Array.isArray(input.employment_type_cuids)) {
		rawEmploymentTypeCuids = input.employment_type_cuids.map(String);
	} else if (typeof input.employment_type_cuids === 'string') {
		const str = input.employment_type_cuids.trim();
		rawEmploymentTypeCuids = str ? str.split(',').map((x) => x.trim()) : [];
	} else {
		throw new LeaveValidationError('employment_type_cuids', 'Employment types must be provided');
	}

	const employmentTypeCuids = Array.from(new Set(rawEmploymentTypeCuids.filter((x) => x)));
	if (employmentTypeCuids.length === 0) {
		throw new LeaveValidationError('employment_type_cuids', 'At least one employment type is required');
	}

	for (const empTypeCuid of employmentTypeCuids) {
		const empType = (await masterDataDao.findByCuid2('employment-types', empTypeCuid)) as any;
		if (!empType) {
			throw new LeaveValidationError('employment_type_cuids', `Employment type ${empTypeCuid} does not exist`);
		}
		if ('status' in empType && !empType.status) {
			throw new LeaveValidationError('employment_type_cuids', `Employment type '${empType.name}' is inactive`);
		}
	}

	if (input.annual_limit === undefined || input.annual_limit === null || String(input.annual_limit).trim() === '') {
		throw new LeaveValidationError('annual_limit', 'Annual limit is required');
	}
	if (isNaN(Number(input.annual_limit))) {
		throw new LeaveValidationError('annual_limit', 'Only numeric values are allowed');
	}
	const annual_limit = Number(input.annual_limit);
	if (annual_limit <= 0) {
		throw new LeaveValidationError('annual_limit', 'Value must be greater than 0');
	}

	let max_per_month: number | null = null;
	if (input.max_per_month !== undefined && input.max_per_month !== null && String(input.max_per_month).trim() !== '') {
		if (isNaN(Number(input.max_per_month))) {
			throw new LeaveValidationError('max_per_month', 'Only numeric values are allowed');
		}
		max_per_month = Number(input.max_per_month);
		if (max_per_month <= 0) {
			throw new LeaveValidationError('max_per_month', 'Value must be greater than 0');
		}
		if (max_per_month > annual_limit) {
			throw new LeaveValidationError('max_per_month', 'Max per month cannot exceed annual limit');
		}
	}

	const carry_forward_allowed = Boolean(input.carry_forward_allowed);
	let max_carry_forward_days: number | null = null;
	let max_annual_carry_forward_days: number | null = null;
	if (carry_forward_allowed) {
		if (
			input.max_carry_forward_days === undefined ||
			input.max_carry_forward_days === null ||
			String(input.max_carry_forward_days).trim() === ''
		) {
			throw new LeaveValidationError('max_carry_forward_days', 'Max carry forward days is required when carry forward is allowed');
		}
		if (isNaN(Number(input.max_carry_forward_days))) {
			throw new LeaveValidationError('max_carry_forward_days', 'Only numeric values are allowed');
		}
		max_carry_forward_days = Number(input.max_carry_forward_days);
		if (max_carry_forward_days <= 0) {
			throw new LeaveValidationError('max_carry_forward_days', 'Value must be greater than 0');
		}

		if (
			input.max_annual_carry_forward_days === undefined ||
			input.max_annual_carry_forward_days === null ||
			String(input.max_annual_carry_forward_days).trim() === ''
		) {
			throw new LeaveValidationError('max_annual_carry_forward_days', 'Max annual carry forward days is required when carry forward is allowed');
		}
		if (isNaN(Number(input.max_annual_carry_forward_days))) {
			throw new LeaveValidationError('max_annual_carry_forward_days', 'Only numeric values are allowed');
		}
		max_annual_carry_forward_days = Number(input.max_annual_carry_forward_days);
		if (max_annual_carry_forward_days <= 0) {
			throw new LeaveValidationError('max_annual_carry_forward_days', 'Value must be greater than 0');
		}
		if (max_annual_carry_forward_days > max_carry_forward_days) {
			throw new LeaveValidationError('max_annual_carry_forward_days', 'Max annual carry forward days cannot exceed max carry forward days');
		}
	} else {
		if (
			input.max_carry_forward_days !== undefined &&
			input.max_carry_forward_days !== null &&
			String(input.max_carry_forward_days).trim() !== ''
		) {
			throw new LeaveValidationError('max_carry_forward_days', 'Max carry forward days must be empty when carry forward is not allowed');
		}
		if (
			input.max_annual_carry_forward_days !== undefined &&
			input.max_annual_carry_forward_days !== null &&
			String(input.max_annual_carry_forward_days).trim() !== ''
		) {
			throw new LeaveValidationError('max_annual_carry_forward_days', 'Max annual carry forward days must be empty when carry forward is not allowed');
		}
	}

	let min_service_days = 0;
	if (input.min_service_days !== undefined && input.min_service_days !== null && String(input.min_service_days).trim() !== '') {
		if (isNaN(Number(input.min_service_days))) {
			throw new LeaveValidationError('min_service_days', 'Only numeric values are allowed');
		}
		min_service_days = Number(input.min_service_days);
		if (min_service_days < 0) {
			throw new LeaveValidationError('min_service_days', 'Value must be greater than or equal to 0');
		}
	}

	const document_required = Boolean(input.document_required);
	let document_required_after_days: number | null = null;
	if (document_required) {
		if (
			input.document_required_after_days !== undefined &&
			input.document_required_after_days !== null &&
			String(input.document_required_after_days).trim() !== ''
		) {
			if (isNaN(Number(input.document_required_after_days))) {
				throw new LeaveValidationError('document_required_after_days', 'Only numeric values are allowed');
			}
			document_required_after_days = Number(input.document_required_after_days);
			if (document_required_after_days <= 0) {
				throw new LeaveValidationError('document_required_after_days', 'Value must be greater than 0');
			}
		}
	} else {
		if (
			input.document_required_after_days !== undefined &&
			input.document_required_after_days !== null &&
			String(input.document_required_after_days).trim() !== ''
		) {
			throw new LeaveValidationError('document_required_after_days', 'Document required after days must be empty when document upload is not required');
		}
	}
	const allow_half_day = Boolean(input.allow_half_day);

	const gender_specific = Boolean(input.gender_specific);
	let applicable_gender: 'Male' | 'Female' | 'Others' | null = null;
	if (gender_specific) {
		if (!input.applicable_gender) {
			throw new LeaveValidationError('applicable_gender', 'Applicable gender is required when gender specific is enabled');
		}
		const gender = String(input.applicable_gender);
		if (gender !== 'Male' && gender !== 'Female' && gender !== 'Others') {
			throw new LeaveValidationError('applicable_gender', 'Applicable gender must be Male, Female, or Others');
		}
		applicable_gender = gender;
	}

	const status = input.status === undefined ? true : Boolean(input.status);

	if (status) {
		const errors: Record<string, string> = {};
		for (const empTypeCuid of employmentTypeCuids) {
			const duplicate = await leavePolicyDao.findActivePolicyForEmploymentType(
				leave_type_cuid,
				empTypeCuid,
				excludePolicyCuid
			);

			if (duplicate) {
				errors.employment_type_cuids = 'Leave Policy already exists for this employment type and leave type';
				break;
			}
		}
		if (Object.keys(errors).length > 0) {
			throw new LeaveMultiValidationError(errors);
		}
	}

	return {
		policyData: {
			leave_type_cuid,
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
		},
		employmentTypeCuids
	};
}

export async function listLeavePolicies() {
	return leavePolicyDao.list();
}

export async function getLeavePolicyByCuid(cuid: string) {
	return leavePolicyDao.findByCuid(cuid);
}

export async function createLeavePolicy(input: CreateLeavePolicyInput) {
	const { policyData, employmentTypeCuids } = await validateAndMapPolicyInput(input);
	return leavePolicyDao.create({
		...policyData,
		created_by: input.created_by,
		updated_by: input.updated_by
	}, employmentTypeCuids);
}

export async function updateLeavePolicy(cuid: string, input: UpdateLeavePolicyInput) {
	if (!cuid || typeof cuid !== 'string') {
		throw new Error('Leave policy CUID is required for updates');
	}

	const existingPolicy = await leavePolicyDao.findByCuid(cuid);
	if (!existingPolicy) {
		throw new Error('Leave policy not found');
	}

	const mappedExistingPolicy = {
		leave_type_cuid: existingPolicy.leave_type_cuid,
		employment_type_cuids: existingPolicy.employment_type_cuids,
		annual_limit: existingPolicy.annual_limit,
		max_per_month: existingPolicy.max_per_month,
		carry_forward_allowed: existingPolicy.carry_forward_allowed,
		max_carry_forward_days: existingPolicy.max_carry_forward_days,
		max_annual_carry_forward_days: existingPolicy.max_annual_carry_forward_days,
		document_required: existingPolicy.document_required,
		document_required_after_days: existingPolicy.document_required_after_days,
		min_service_days: existingPolicy.min_service_days,
		allow_half_day: existingPolicy.allow_half_day,
		gender_specific: existingPolicy.gender_specific,
		applicable_gender: existingPolicy.applicable_gender,
		status: existingPolicy.status
	};

	const { policyData, employmentTypeCuids } = await validateAndMapPolicyInput(
		{
			...mappedExistingPolicy,
			...input
		},
		existingPolicy.cuid
	);

	return leavePolicyDao.update(cuid, {
		...policyData,
		updated_by: input.updated_by
	}, employmentTypeCuids);
}
