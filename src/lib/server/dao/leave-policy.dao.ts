import { db } from '$lib/server/db.js';

export interface CreateLeavePolicyData {
	leave_type_id: number;
	annual_quota: number;
	max_per_month: number | null;
	carry_forward_allowed: boolean;
	max_carry_forward_days: number | null;
	requires_document: boolean;
	min_service_days: number;
	allow_half_day: boolean;
	gender_specific: boolean;
	applicable_gender: 'Male' | 'Female' | 'Others' | null;
	status: boolean;
}

export async function list() {
	const policies = await db.leavePolicy.findMany({
		orderBy: { id: 'asc' }
	});

	const policyIds = policies.map((p) => p.id);
	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			policy_id: { in: policyIds }
		}
	});

	const mappingsMap = new Map<number, number[]>();
	for (const m of mappings) {
		if (!mappingsMap.has(m.policy_id)) {
			mappingsMap.set(m.policy_id, []);
		}
		mappingsMap.get(m.policy_id)!.push(m.employment_type_id);
	}

	return policies.map((p) => ({
		...p,
		annual_quota: Number(p.annual_quota),
		max_per_month: p.max_per_month !== null ? Number(p.max_per_month) : null,
		max_carry_forward_days: p.max_carry_forward_days !== null ? Number(p.max_carry_forward_days) : null,
		employment_type_ids: mappingsMap.get(p.id) || []
	}));
}

export async function create(policyData: CreateLeavePolicyData, employmentTypeIds: number[]) {
	return db.$transaction(async (tx) => {
		const createdPolicy = await tx.leavePolicy.create({
			data: {
				leave_type_id: policyData.leave_type_id,
				annual_quota: policyData.annual_quota,
				max_per_month: policyData.max_per_month,
				carry_forward_allowed: policyData.carry_forward_allowed,
				max_carry_forward_days: policyData.max_carry_forward_days,
				requires_document: policyData.requires_document,
				min_service_days: policyData.min_service_days,
				allow_half_day: policyData.allow_half_day,
				gender_specific: policyData.gender_specific,
				applicable_gender: policyData.applicable_gender,
				status: policyData.status
			}
		});

		if (employmentTypeIds.length > 0) {
			await tx.leavePolicyEmploymentType.createMany({
				data: employmentTypeIds.map((id) => ({
					policy_id: createdPolicy.id,
					employment_type_id: id
				}))
			});
		}

		return {
			...createdPolicy,
			annual_quota: Number(createdPolicy.annual_quota),
			max_per_month: createdPolicy.max_per_month !== null ? Number(createdPolicy.max_per_month) : null,
			max_carry_forward_days: createdPolicy.max_carry_forward_days !== null ? Number(createdPolicy.max_carry_forward_days) : null,
			employment_type_ids: employmentTypeIds
		};
	});
}

export async function update(uuid: string, policyData: Partial<CreateLeavePolicyData>, employmentTypeIds?: number[]) {
	return db.$transaction(async (tx) => {
		const updatedPolicy = await tx.leavePolicy.update({
			where: { uuid },
			data: {
				leave_type_id: policyData.leave_type_id,
				annual_quota: policyData.annual_quota,
				max_per_month: policyData.max_per_month,
				carry_forward_allowed: policyData.carry_forward_allowed,
				max_carry_forward_days: policyData.max_carry_forward_days,
				requires_document: policyData.requires_document,
				min_service_days: policyData.min_service_days,
				allow_half_day: policyData.allow_half_day,
				gender_specific: policyData.gender_specific,
				applicable_gender: policyData.applicable_gender,
				status: policyData.status
			}
		});

		if (employmentTypeIds !== undefined) {
			await tx.leavePolicyEmploymentType.deleteMany({
				where: {
					policy_id: updatedPolicy.id
				}
			});

			if (employmentTypeIds.length > 0) {
				await tx.leavePolicyEmploymentType.createMany({
					data: employmentTypeIds.map((id) => ({
						policy_id: updatedPolicy.id,
						employment_type_id: id
					}))
				});
			}
		}

		const mappings = await tx.leavePolicyEmploymentType.findMany({
			where: {
				policy_id: updatedPolicy.id
			}
		});

		return {
			...updatedPolicy,
			annual_quota: Number(updatedPolicy.annual_quota),
			max_per_month: updatedPolicy.max_per_month !== null ? Number(updatedPolicy.max_per_month) : null,
			max_carry_forward_days: updatedPolicy.max_carry_forward_days !== null ? Number(updatedPolicy.max_carry_forward_days) : null,
			employment_type_ids: mappings.map((m) => m.employment_type_id)
		};
	});
}

export async function deletePolicy(uuid: string) {
	const policy = await db.leavePolicy.findUnique({
		where: { uuid }
	});

	if (!policy) {
		throw new Error('Leave policy not found');
	}

	return db.$transaction(async (tx) => {
		await tx.leavePolicyEmploymentType.deleteMany({
			where: {
				policy_id: policy.id
			}
		});

		await tx.leavePolicy.delete({
			where: { uuid }
		});

		return policy;
	});
}

export async function findByUuid(uuid: string) {
	const policy = await db.leavePolicy.findUnique({
		where: { uuid }
	});

	if (!policy) return null;

	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			policy_id: policy.id
		}
	});

	return {
		...policy,
		annual_quota: Number(policy.annual_quota),
		max_per_month: policy.max_per_month !== null ? Number(policy.max_per_month) : null,
		max_carry_forward_days: policy.max_carry_forward_days !== null ? Number(policy.max_carry_forward_days) : null,
		employment_type_ids: mappings.map((m) => m.employment_type_id)
	};
}

export async function findActivePolicyForEmploymentType(
	leave_type_id: number,
	employment_type_id: number,
	excludePolicyId?: number
) {
	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			employment_type_id
		},
		select: {
			policy_id: true
		}
	});

	if (mappings.length === 0) {
		return null;
	}

	const policyIds = mappings.map((m) => m.policy_id);

	return db.leavePolicy.findFirst({
		where: {
			id: { in: policyIds },
			leave_type_id,
			status: true,
			NOT: excludePolicyId ? { id: excludePolicyId } : undefined
		}
	});
}
