import { db } from '$lib/server/db.js';
import * as leavePolicyDao from '$lib/server/dao/leave-policy.dao.js';
import { LeaveValidationError } from './leave-type.service.js';

export interface CreateLeavePolicyInput {
	leave_type_id: unknown;
	employment_type_ids: unknown;
	annual_quota: unknown;
	max_per_month?: unknown;
	carry_forward_allowed?: unknown;
	max_carry_forward_days?: unknown;
	requires_document?: unknown;
	min_service_days?: unknown;
	allow_half_day?: unknown;
	gender_specific?: unknown;
	applicable_gender?: unknown;
	status?: unknown;
}

export interface UpdateLeavePolicyInput {
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
}

async function validateAndMapPolicyInput(
	input: CreateLeavePolicyInput | UpdateLeavePolicyInput,
	excludePolicyId?: number
) {
	if (input.leave_type_id === undefined || input.leave_type_id === null || String(input.leave_type_id).trim() === '') {
		throw new LeaveValidationError('leave_type_id', 'Leave type is required');
	}
	const leave_type_id = Number(input.leave_type_id);
	if (isNaN(leave_type_id) || leave_type_id <= 0) {
		throw new LeaveValidationError('leave_type_id', 'Invalid leave type selected');
	}

	const leaveType = await db.leaveType.findUnique({ where: { id: leave_type_id } });
	if (!leaveType) {
		throw new LeaveValidationError('leave_type_id', 'Selected leave type does not exist');
	}
	if (!leaveType.status) {
		throw new LeaveValidationError('leave_type_id', 'Selected leave type is inactive');
	}

	if (input.employment_type_ids === undefined || input.employment_type_ids === null) {
		throw new LeaveValidationError('employment_type_ids', 'At least one employment type is required');
	}

	let rawEmploymentTypeIds: number[];
	if (Array.isArray(input.employment_type_ids)) {
		rawEmploymentTypeIds = input.employment_type_ids.map(Number);
	} else if (typeof input.employment_type_ids === 'string') {
		const str = input.employment_type_ids.trim();
		rawEmploymentTypeIds = str ? str.split(',').map((x) => Number(x.trim())) : [];
	} else if (typeof input.employment_type_ids === 'number') {
		rawEmploymentTypeIds = [input.employment_type_ids];
	} else {
		throw new LeaveValidationError('employment_type_ids', 'Employment types must be provided');
	}

	const employmentTypeIds = Array.from(new Set(rawEmploymentTypeIds.filter((x) => !isNaN(x) && x > 0)));
	if (employmentTypeIds.length === 0) {
		throw new LeaveValidationError('employment_type_ids', 'At least one employment type is required');
	}

	for (const empTypeId of employmentTypeIds) {
		const empType = await db.employmentType.findUnique({ where: { id: empTypeId } });
		if (!empType) {
			throw new LeaveValidationError('employment_type_ids', `Employment type ID ${empTypeId} does not exist`);
		}
		if (!empType.status) {
			throw new LeaveValidationError('employment_type_ids', `Employment type '${empType.employment_name}' is inactive`);
		}
	}

	if (input.annual_quota === undefined || input.annual_quota === null || String(input.annual_quota).trim() === '') {
		throw new LeaveValidationError('annual_quota', 'Annual quota is required');
	}
	const annual_quota = Number(input.annual_quota);
	if (isNaN(annual_quota) || annual_quota < 0) {
		throw new LeaveValidationError('annual_quota', 'Annual quota must be a positive number');
	}

	let max_per_month: number | null = null;
	if (input.max_per_month !== undefined && input.max_per_month !== null && String(input.max_per_month).trim() !== '') {
		max_per_month = Number(input.max_per_month);
		if (isNaN(max_per_month) || max_per_month < 0) {
			throw new LeaveValidationError('max_per_month', 'Max per month must be a positive number');
		}
		if (max_per_month > annual_quota) {
			throw new LeaveValidationError('max_per_month', 'Max per month cannot exceed annual quota');
		}
	}

	const carry_forward_allowed = Boolean(input.carry_forward_allowed);
	let max_carry_forward_days: number | null = null;
	if (carry_forward_allowed) {
		if (
			input.max_carry_forward_days === undefined ||
			input.max_carry_forward_days === null ||
			String(input.max_carry_forward_days).trim() === ''
		) {
			throw new LeaveValidationError('max_carry_forward_days', 'Max carry forward days is required when carry forward is allowed');
		}
		max_carry_forward_days = Number(input.max_carry_forward_days);
		if (isNaN(max_carry_forward_days) || max_carry_forward_days < 0) {
			throw new LeaveValidationError('max_carry_forward_days', 'Max carry forward days must be a positive number');
		}
		if (max_carry_forward_days > annual_quota) {
			throw new LeaveValidationError('max_carry_forward_days', 'Max carry forward days cannot exceed annual quota');
		}
	}

	let min_service_days = 0;
	if (input.min_service_days !== undefined && input.min_service_days !== null && String(input.min_service_days).trim() !== '') {
		min_service_days = Number(input.min_service_days);
		if (isNaN(min_service_days) || !Number.isInteger(min_service_days) || min_service_days < 0) {
			throw new LeaveValidationError('min_service_days', 'Min service days must be a positive integer');
		}
	}

	const requires_document = Boolean(input.requires_document);
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
		for (const empTypeId of employmentTypeIds) {
			const duplicate = await leavePolicyDao.findActivePolicyForEmploymentType(
				leave_type_id,
				empTypeId,
				excludePolicyId
			);
			if (duplicate) {
				throw new LeaveValidationError(
					'employment_type_ids',
					'Policy already exists for selected employment type'
				);
			}
		}
	}

	return {
		policyData: {
			leave_type_id,
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
		},
		employmentTypeIds
	};
}

export async function listLeavePolicies() {
	return leavePolicyDao.list();
}

export async function getLeavePolicyByUuid(uuid: string) {
	return leavePolicyDao.findByUuid(uuid);
}

export async function createLeavePolicy(input: CreateLeavePolicyInput) {
	const { policyData, employmentTypeIds } = await validateAndMapPolicyInput(input);
	return leavePolicyDao.create(policyData, employmentTypeIds);
}

export async function updateLeavePolicy(uuid: string, input: UpdateLeavePolicyInput) {
	if (!uuid || typeof uuid !== 'string') {
		throw new Error('Leave policy UUID is required for updates');
	}

	const existingPolicy = await leavePolicyDao.findByUuid(uuid);
	if (!existingPolicy) {
		throw new Error('Leave policy not found');
	}

	const { policyData, employmentTypeIds } = await validateAndMapPolicyInput(
		{
			...existingPolicy,
			...input
		},
		existingPolicy.id
	);

	return leavePolicyDao.update(uuid, policyData, employmentTypeIds);
}

export async function deleteLeavePolicy(uuid: string) {
	if (!uuid || typeof uuid !== 'string') {
		throw new Error('Leave policy UUID is required for deletion');
	}

	return leavePolicyDao.deletePolicy(uuid);
}
