import { db } from '$lib/server/db.js';

export interface CreateLeavePolicyData {
	leave_type_cuid: string;
	annual_limit: number;
	max_per_month: number | null;
	carry_forward_allowed: boolean;
	max_carry_forward_days: number | null;
	document_required: boolean;
	document_required_after_days: number | null;
	min_service_days: number;
	allow_half_day: boolean;
	gender_specific: boolean;
	applicable_gender: 'Male' | 'Female' | 'Others' | null;
	status: boolean;
	created_by?: string | null;
	updated_by?: string | null;
}

export async function list() {
	const policies = await db.leavePolicy.findMany({
		select: {
			cuid: true,
			leave_type_cuid: true,
			annual_limit: true,
			max_per_month: true,
			carry_forward_allowed: true,
			max_carry_forward_days: true,
			document_required: true,
			document_required_after_days: true,
			min_service_days: true,
			allow_half_day: true,
			gender_specific: true,
			applicable_gender: true,
			status: true
		},
		orderBy: { updated_at: 'desc' }
	});

	const policyCuids = policies.map((p) => p.cuid);
	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			leave_policy_cuid: { in: policyCuids }
		}
	});

	const mappingsMap = new Map<string, string[]>();
	for (const m of mappings) {
		if (!mappingsMap.has(m.leave_policy_cuid)) {
			mappingsMap.set(m.leave_policy_cuid, []);
		}
		mappingsMap.get(m.leave_policy_cuid)!.push(m.employment_type_cuid);
	}

	return policies.map((p) => ({
		...p,
		annual_limit: Number(p.annual_limit),
		max_per_month: p.max_per_month !== null ? Number(p.max_per_month) : null,
		max_carry_forward_days: p.max_carry_forward_days !== null ? Number(p.max_carry_forward_days) : null,
		employment_type_cuids: mappingsMap.get(p.cuid) || []
	}));
}

export async function create(policyData: CreateLeavePolicyData, employmentTypeCuids: string[]) {
	return db.$transaction(async (tx) => {
		const createdPolicy = await tx.leavePolicy.create({
			data: {
				leave_type_cuid: policyData.leave_type_cuid,
				annual_limit: policyData.annual_limit,
				max_per_month: policyData.max_per_month,
				carry_forward_allowed: policyData.carry_forward_allowed,
				max_carry_forward_days: policyData.max_carry_forward_days,
				document_required: policyData.document_required,
				document_required_after_days: policyData.document_required_after_days,
				min_service_days: policyData.min_service_days,
				allow_half_day: policyData.allow_half_day,
				gender_specific: policyData.gender_specific,
				applicable_gender: policyData.applicable_gender,
				status: policyData.status,
				created_by: policyData.created_by,
				updated_by: policyData.updated_by
			}
		});

		if (employmentTypeCuids.length > 0) {
			await tx.leavePolicyEmploymentType.createMany({
				data: employmentTypeCuids.map((cuid) => ({
					leave_policy_cuid: createdPolicy.cuid,
					employment_type_cuid: cuid,
					created_by: policyData.created_by,
					updated_by: policyData.updated_by
				}))
			});
		}

		return {
			...createdPolicy,
			annual_limit: Number(createdPolicy.annual_limit),
			max_per_month: createdPolicy.max_per_month !== null ? Number(createdPolicy.max_per_month) : null,
			max_carry_forward_days: createdPolicy.max_carry_forward_days !== null ? Number(createdPolicy.max_carry_forward_days) : null,
			employment_type_cuids: employmentTypeCuids
		};
	});
}

export async function update(cuid: string, policyData: Partial<CreateLeavePolicyData>, employmentTypeCuids?: string[]) {
	return db.$transaction(async (tx) => {
		const updatedPolicy = await tx.leavePolicy.update({
			where: { cuid },
			data: {
				leave_type_cuid: policyData.leave_type_cuid,
				annual_limit: policyData.annual_limit,
				max_per_month: policyData.max_per_month,
				carry_forward_allowed: policyData.carry_forward_allowed,
				max_carry_forward_days: policyData.max_carry_forward_days,
				document_required: policyData.document_required,
				document_required_after_days: policyData.document_required_after_days,
				min_service_days: policyData.min_service_days,
				allow_half_day: policyData.allow_half_day,
				gender_specific: policyData.gender_specific,
				applicable_gender: policyData.applicable_gender,
				status: policyData.status,
				deactivated_by_leave_type: policyData.status !== undefined ? false : undefined,
				updated_by: policyData.updated_by
			}
		});

		if (employmentTypeCuids !== undefined) {
			await tx.leavePolicyEmploymentType.deleteMany({
				where: {
					leave_policy_cuid: updatedPolicy.cuid
				}
			});

			if (employmentTypeCuids.length > 0) {
				await tx.leavePolicyEmploymentType.createMany({
					data: employmentTypeCuids.map((cuid) => ({
						leave_policy_cuid: updatedPolicy.cuid,
						employment_type_cuid: cuid,
						created_by: policyData.updated_by,
						updated_by: policyData.updated_by
					}))
				});
			}
		}

		const mappings = await tx.leavePolicyEmploymentType.findMany({
			where: {
				leave_policy_cuid: updatedPolicy.cuid
			}
		});

		return {
			...updatedPolicy,
			annual_limit: Number(updatedPolicy.annual_limit),
			max_per_month: updatedPolicy.max_per_month !== null ? Number(updatedPolicy.max_per_month) : null,
			max_carry_forward_days: updatedPolicy.max_carry_forward_days !== null ? Number(updatedPolicy.max_carry_forward_days) : null,
			employment_type_cuids: mappings.map((m) => m.employment_type_cuid)
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
				leave_policy_cuid: policy.cuid
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
		where: { cuid },
		select: {
			cuid: true,
			leave_type_cuid: true,
			annual_limit: true,
			max_per_month: true,
			carry_forward_allowed: true,
			max_carry_forward_days: true,
			document_required: true,
			document_required_after_days: true,
			min_service_days: true,
			allow_half_day: true,
			gender_specific: true,
			applicable_gender: true,
			status: true
		}
	});

	if (!policy) return null;

	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			leave_policy_cuid: policy.cuid
		}
	});

	return {
		...policy,
		annual_limit: Number(policy.annual_limit),
		max_per_month: policy.max_per_month !== null ? Number(policy.max_per_month) : null,
		max_carry_forward_days: policy.max_carry_forward_days !== null ? Number(policy.max_carry_forward_days) : null,
		employment_type_cuids: mappings.map((m) => m.employment_type_cuid)
	};
}

export async function findActivePolicyForEmploymentType(
	leave_type_cuid: string,
	employment_type_cuid: string,
	excludePolicyCuid?: string
) {
	const mappings = await db.leavePolicyEmploymentType.findMany({
		where: {
			employment_type_cuid
		},
		select: {
			leave_policy_cuid: true
		}
	});

	if (mappings.length === 0) {
		return null;
	}

	const policyCuids = mappings.map((m) => m.leave_policy_cuid);

	return db.leavePolicy.findFirst({
		where: {
			cuid: { in: policyCuids },
			leave_type_cuid,
			status: true,
			NOT: excludePolicyCuid ? { cuid: excludePolicyCuid } : undefined
		}
	});
}
