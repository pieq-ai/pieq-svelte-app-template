import { db } from '$lib/server/db.js';

export interface CreateLeavePolicyData {
	leave_type_uuid: string;
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

	const policyCuids = policies.map((p) => p.cuid);
	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			leave_policy_uuid: { in: policyCuids }
		}
	});

	const mappingsMap = new Map<string, string[]>();
	for (const m of mappings) {
		if (!mappingsMap.has(m.leave_policy_uuid)) {
			mappingsMap.set(m.leave_policy_uuid, []);
		}
		mappingsMap.get(m.leave_policy_uuid)!.push(m.employment_type_uuid);
	}

	return policies.map((p) => ({
		...p,
		annual_quota: Number(p.annual_quota),
		max_per_month: p.max_per_month !== null ? Number(p.max_per_month) : null,
		max_carry_forward_days: p.max_carry_forward_days !== null ? Number(p.max_carry_forward_days) : null,
		employment_type_uuids: mappingsMap.get(p.cuid) || []
	}));
}

export async function create(policyData: CreateLeavePolicyData, employmentTypeUuids: string[]) {
	return db.$transaction(async (tx) => {
		const createdPolicy = await tx.leavePolicy.create({
			data: {
				leave_type_uuid: policyData.leave_type_uuid,
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

		if (employmentTypeUuids.length > 0) {
			await tx.leavePolicyEmploymentType.createMany({
				data: employmentTypeUuids.map((uuid) => ({
					leave_policy_uuid: createdPolicy.cuid,
					employment_type_uuid: uuid
				}))
			});
		}

		return {
			...createdPolicy,
			annual_quota: Number(createdPolicy.annual_quota),
			max_per_month: createdPolicy.max_per_month !== null ? Number(createdPolicy.max_per_month) : null,
			max_carry_forward_days: createdPolicy.max_carry_forward_days !== null ? Number(createdPolicy.max_carry_forward_days) : null,
			employment_type_uuids: employmentTypeUuids
		};
	});
}

export async function update(cuid: string, policyData: Partial<CreateLeavePolicyData>, employmentTypeUuids?: string[]) {
	return db.$transaction(async (tx) => {
		const updatedPolicy = await tx.leavePolicy.update({
			where: { cuid },
			data: {
				leave_type_uuid: policyData.leave_type_uuid,
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

		if (employmentTypeUuids !== undefined) {
			await tx.leavePolicyEmploymentType.deleteMany({
				where: {
					leave_policy_uuid: updatedPolicy.cuid
				}
			});

			if (employmentTypeUuids.length > 0) {
				await tx.leavePolicyEmploymentType.createMany({
					data: employmentTypeUuids.map((uuid) => ({
						leave_policy_uuid: updatedPolicy.cuid,
						employment_type_uuid: uuid
					}))
				});
			}
		}

		const mappings = await tx.leavePolicyEmploymentType.findMany({
			where: {
				leave_policy_uuid: updatedPolicy.cuid
			}
		});

		return {
			...updatedPolicy,
			annual_quota: Number(updatedPolicy.annual_quota),
			max_per_month: updatedPolicy.max_per_month !== null ? Number(updatedPolicy.max_per_month) : null,
			max_carry_forward_days: updatedPolicy.max_carry_forward_days !== null ? Number(updatedPolicy.max_carry_forward_days) : null,
			employment_type_uuids: mappings.map((m) => m.employment_type_uuid)
		};
	});
}

export async function deletePolicy(cuid: string) {
	const policy = await db.leavePolicy.findUnique({
		where: { cuid }
	});

	if (!policy) {
		throw new Error('Leave policy not found');
	}

	return db.$transaction(async (tx) => {
		await tx.leavePolicyEmploymentType.deleteMany({
			where: {
				leave_policy_uuid: policy.cuid
			}
		});

		await tx.leavePolicy.delete({
			where: { cuid }
		});

		return policy;
	});
}

export async function findByCuid(cuid: string) {
	const policy = await db.leavePolicy.findUnique({
		where: { cuid }
	});

	if (!policy) return null;

	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			leave_policy_uuid: policy.cuid
		}
	});

	return {
		...policy,
		annual_quota: Number(policy.annual_quota),
		max_per_month: policy.max_per_month !== null ? Number(policy.max_per_month) : null,
		max_carry_forward_days: policy.max_carry_forward_days !== null ? Number(policy.max_carry_forward_days) : null,
		employment_type_uuids: mappings.map((m) => m.employment_type_uuid)
	};
}

export async function findActivePolicyForEmploymentType(
	leave_type_uuid: string,
	employment_type_uuid: string,
	excludePolicyCuid?: string
) {
	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			employment_type_uuid
		},
		select: {
			leave_policy_uuid: true
		}
	});

	if (mappings.length === 0) {
		return null;
	}

	const policyCuids = mappings.map((m) => m.leave_policy_uuid);

	return db.leavePolicy.findFirst({
		where: {
			cuid: { in: policyCuids },
			leave_type_uuid,
			status: true,
			NOT: excludePolicyCuid ? { cuid: excludePolicyCuid } : undefined
		}
	});
}
