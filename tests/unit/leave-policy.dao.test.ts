import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	list,
	create,
	update,
	findByCuid,
	findActivePolicyForEmploymentType
} from '$lib/server/dao/leave-policy.dao.js';
import { db } from '$lib/server/db.js';
import type { PrismaClient } from '$lib/generated/prisma/client.js';

vi.mock('$lib/server/db.js', () => {
	const mockTx = {
		leavePolicy: {
			create: vi.fn(),
			update: vi.fn()
		},
		leavePolicyEmploymentType: {
			createMany: vi.fn(),
			deleteMany: vi.fn(),
			findMany: vi.fn()
		}
	};
	return {
		db: {
			$transaction: vi.fn((callback) => callback(mockTx)),
			leavePolicy: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				findFirst: vi.fn()
			},
			leavePolicyEmploymentType: {
				findMany: vi.fn()
			}
		}
	};
});

describe('leave-policy DAO', () => {
	let mockTx: {
		leavePolicy: {
			create: ReturnType<typeof vi.fn>;
			update: ReturnType<typeof vi.fn>;
		};
		leavePolicyEmploymentType: {
			createMany: ReturnType<typeof vi.fn>;
			deleteMany: ReturnType<typeof vi.fn>;
			findMany: ReturnType<typeof vi.fn>;
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
		const dbMock = vi.mocked(db);
		dbMock.$transaction.mockImplementation(async (callback: (tx: PrismaClient) => Promise<any>) => {
			mockTx = {
				leavePolicy: {
					create: vi.fn().mockResolvedValue({ cuid: 'test-policy-cuid', annual_limit: 10n, max_per_month: null, max_carry_forward_days: null, max_annual_carry_forward_days: null }),
					update: vi.fn().mockResolvedValue({ cuid: 'test-policy-cuid', annual_limit: 20n, max_per_month: null, max_carry_forward_days: null, max_annual_carry_forward_days: null })
				},
				leavePolicyEmploymentType: {
					createMany: vi.fn().mockResolvedValue({ count: 2 }),
					deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
					findMany: vi.fn().mockResolvedValue([{ leave_policy_cuid: 'test-policy-cuid', employment_type_cuid: 'emp-1' }])
				}
			};
			return callback(mockTx as unknown as PrismaClient);
		});
	});

	it('should list policies mapped with employment types', async () => {
		const mockPolicies = [
			{
				cuid: 'policy-1',
				leave_type_cuid: 'type-1',
				annual_limit: 15n,
				max_per_month: null,
				carry_forward_allowed: false,
				max_carry_forward_days: null,
				max_annual_carry_forward_days: null,
				document_required: false,
				document_required_after_days: null,
				min_service_days: 0,
				allow_half_day: false,
				gender_specific: false,
				applicable_gender: null,
				status: true
			}
		];
		vi.mocked(db.leavePolicy.findMany).mockResolvedValue(mockPolicies as any);
		vi.mocked(db.leavePolicyEmploymentType.findMany).mockResolvedValue([
			{ leave_policy_cuid: 'policy-1', employment_type_cuid: 'emp-1' }
		] as any);

		const result = await list();
		expect(result).toEqual([
			{
				...mockPolicies[0],
				annual_limit: 15,
				employment_type_cuids: ['emp-1']
			}
		]);
	});

	it('should create policy inside transaction', async () => {
		const policyInput = {
			leave_type_cuid: 'type-1',
			annual_limit: 10,
			max_per_month: null,
			carry_forward_allowed: false,
			max_carry_forward_days: null,
			max_annual_carry_forward_days: null,
			document_required: false,
			document_required_after_days: null,
			min_service_days: 0,
			allow_half_day: false,
			gender_specific: false,
			applicable_gender: null,
			status: true
		};

		const result = await create(policyInput, ['emp-1', 'emp-2']);
		expect(result).toEqual({
			cuid: 'test-policy-cuid',
			annual_limit: 10,
			max_per_month: null,
			max_carry_forward_days: null,
			max_annual_carry_forward_days: null,
			employment_type_cuids: ['emp-1', 'emp-2']
		});
		expect(mockTx.leavePolicy.create).toHaveBeenCalledWith({
			data: {
				leave_type_cuid: 'type-1',
				annual_limit: 10,
				max_per_month: null,
				carry_forward_allowed: false,
				max_carry_forward_days: null,
				max_annual_carry_forward_days: null,
				document_required: false,
				document_required_after_days: null,
				min_service_days: 0,
				allow_half_day: false,
				gender_specific: false,
				applicable_gender: null,
				status: true,
				created_by: undefined,
				updated_by: undefined
			}
		});
		expect(mockTx.leavePolicyEmploymentType.createMany).toHaveBeenCalledWith({
			data: [
				{ leave_policy_cuid: 'test-policy-cuid', employment_type_cuid: 'emp-1', created_by: undefined, updated_by: undefined },
				{ leave_policy_cuid: 'test-policy-cuid', employment_type_cuid: 'emp-2', created_by: undefined, updated_by: undefined }
			]
		});
	});

	it('should update policy inside transaction', async () => {
		const result = await update('test-policy-cuid', { annual_limit: 20 }, ['emp-1']);
		expect(result).toEqual({
			cuid: 'test-policy-cuid',
			annual_limit: 20,
			max_per_month: null,
			max_carry_forward_days: null,
			max_annual_carry_forward_days: null,
			employment_type_cuids: ['emp-1']
		});
	});


	it('should find by cuid mapped with employment types', async () => {
		const mockPolicy = {
			cuid: 'policy-1',
			leave_type_cuid: 'type-1',
			annual_limit: 15n,
			max_per_month: null,
			carry_forward_allowed: false,
			max_carry_forward_days: null,
			max_annual_carry_forward_days: null,
			document_required: false,
			document_required_after_days: null,
			min_service_days: 0,
			allow_half_day: false,
			gender_specific: false,
			applicable_gender: null,
			status: true
		};

		vi.mocked(db.leavePolicy.findUnique).mockResolvedValue(mockPolicy as any);
		vi.mocked(db.leavePolicyEmploymentType.findMany).mockResolvedValue([
			{ leave_policy_cuid: 'policy-1', employment_type_cuid: 'emp-1' }
		] as any);

		const result = await findByCuid('policy-1');
		expect(result).toEqual({
			...mockPolicy,
			annual_limit: 15,
			employment_type_cuids: ['emp-1']
		});
	});

	it('should find active policy for employment type', async () => {
		vi.mocked(db.leavePolicyEmploymentType.findMany).mockResolvedValue([
			{ leave_policy_cuid: 'policy-1' }
		] as any);
		vi.mocked(db.leavePolicy.findFirst).mockResolvedValue({ cuid: 'policy-1', leave_type_cuid: 'type-1' } as any);

		const result = await findActivePolicyForEmploymentType('type-1', 'emp-1');
		expect(result).toEqual({ cuid: 'policy-1', leave_type_cuid: 'type-1' });
		expect(db.leavePolicyEmploymentType.findMany).toHaveBeenCalledWith({
			where: { employment_type_cuid: 'emp-1' },
			select: { leave_policy_cuid: true }
		});
		expect(db.leavePolicy.findFirst).toHaveBeenCalledWith({
			where: {
				cuid: { in: ['policy-1'] },
				leave_type_cuid: 'type-1',
				status: true,
				NOT: undefined
			}
		});
	});
});
