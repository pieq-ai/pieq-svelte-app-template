import { beforeEach, describe, expect, it, vi } from 'vitest';
import { update } from '$lib/server/dao/leave-policy.dao.js';
import { db } from '$lib/server/db.js';
import type { PrismaClient } from '$lib/generated/prisma/client.js';

vi.mock('$lib/server/db.js', () => {
	const mockTx = {
		leavePolicy: {
			update: vi.fn()
		},
		leavePolicyEmploymentType: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
			findMany: vi.fn()
		}
	};
	return {
		db: {
			$transaction: vi.fn((callback) => callback(mockTx)),
			leavePolicy: mockTx.leavePolicy,
			leavePolicyEmploymentType: mockTx.leavePolicyEmploymentType
		}
	};
});

describe('leave-policy DAO', () => {
	let mockTx: {
		leavePolicy: {
			update: ReturnType<typeof vi.fn>;
		};
		leavePolicyEmploymentType: {
			deleteMany: ReturnType<typeof vi.fn>;
			createMany: ReturnType<typeof vi.fn>;
			findMany: ReturnType<typeof vi.fn>;
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
		const dbMock = vi.mocked(db);
		dbMock.$transaction.mockImplementation(async (callback) => {
			mockTx = {
				leavePolicy: {
					update: vi.fn().mockResolvedValue({
						cuid: 'test-policy-cuid',
						annual_limit: 10,
						max_per_month: null,
						max_carry_forward_days: null,
						document_required: false,
						document_required_after_days: null,
						status: true
					})
				},
				leavePolicyEmploymentType: {
					deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
					createMany: vi.fn().mockResolvedValue({ count: 0 }),
					findMany: vi.fn().mockResolvedValue([])
				}
			};
			return callback(mockTx as unknown as PrismaClient);
		});
	});

	it('should update policy status and reset deactivated_by_leave_type to false', async () => {
		await update('test-policy-cuid', {
			status: true,
			annual_limit: 12,
			carry_forward_allowed: false,
			gender_specific: false,
			min_service_days: 0,
			document_required: false,
			document_required_after_days: null,
			allow_half_day: false,
			applicable_gender: null,
			leave_type_cuid: 'leave-type-1',
			max_carry_forward_days: null,
			max_per_month: null
		});

		expect(mockTx.leavePolicy.update).toHaveBeenCalledWith({
			where: { cuid: 'test-policy-cuid' },
			data: expect.objectContaining({
				status: true,
				deactivated_by_leave_type: false
			})
		});
	});

	it('should not set deactivated_by_leave_type if status is not updated', async () => {
		await update('test-policy-cuid', {
			annual_limit: 12,
			carry_forward_allowed: false,
			gender_specific: false,
			min_service_days: 0,
			document_required: false,
			document_required_after_days: null,
			allow_half_day: false,
			applicable_gender: null,
			leave_type_cuid: 'leave-type-1',
			max_carry_forward_days: null,
			max_per_month: null
		});

		expect(mockTx.leavePolicy.update).toHaveBeenCalledWith({
			where: { cuid: 'test-policy-cuid' },
			data: expect.objectContaining({
				deactivated_by_leave_type: undefined
			})
		});
	});
});
