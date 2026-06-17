import { beforeEach, describe, expect, it, vi } from 'vitest';
import { update } from '$lib/server/dao/leave-type.dao.js';
import { db } from '$lib/server/db.js';
import type { PrismaClient } from '$lib/generated/prisma/client.js';

vi.mock('$lib/server/db.js', () => {
	const mockTx = {
		leaveType: {
			update: vi.fn()
		},
		leavePolicy: {
			updateMany: vi.fn()
		}
	};
	return {
		db: {
			$transaction: vi.fn((callback: (tx: any) => any) => callback(mockTx)),
			leaveType: mockTx.leaveType,
			leavePolicy: mockTx.leavePolicy
		}
	};
});

describe('leave-type DAO', () => {
	let mockTx: {
		leaveType: {
			update: ReturnType<typeof vi.fn>;
		};
		leavePolicy: {
			updateMany: ReturnType<typeof vi.fn>;
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
		const dbMock = vi.mocked(db);
		dbMock.$transaction.mockImplementation(async (callback: (tx: PrismaClient) => Promise<any>) => {
			mockTx = {
				leaveType: {
					update: vi.fn().mockResolvedValue({ cuid: 'test-cuid', status: true })
				},
				leavePolicy: {
					updateMany: vi.fn().mockResolvedValue({ count: 1 })
				}
			};
			return callback(mockTx as unknown as PrismaClient);
		});
	});

	it('should update leave type status and set deactivated_by_leave_type flag to true when deactivated', async () => {
		await update('test-cuid', { status: false, name: 'Sick Leave', code: 'SICK', is_paid: true, requires_approval: true });

		expect(mockTx.leaveType.update).toHaveBeenCalledWith({
			where: { cuid: 'test-cuid' },
			data: { status: false, name: 'Sick Leave', code: 'SICK', is_paid: true, requires_approval: true }
		});

		expect(mockTx.leavePolicy.updateMany).toHaveBeenCalledWith({
			where: {
				leave_type_cuid: 'test-cuid',
				status: true
			},
			data: {
				status: false,
				deactivated_by_leave_type: true
			}
		});
	});

	it('should update leave type status and restore policies when reactivated', async () => {
		await update('test-cuid', { status: true, name: 'Sick Leave', code: 'SICK', is_paid: true, requires_approval: true });

		expect(mockTx.leaveType.update).toHaveBeenCalledWith({
			where: { cuid: 'test-cuid' },
			data: { status: true, name: 'Sick Leave', code: 'SICK', is_paid: true, requires_approval: true }
		});

		expect(mockTx.leavePolicy.updateMany).toHaveBeenCalledWith({
			where: {
				leave_type_cuid: 'test-cuid',
				deactivated_by_leave_type: true
			},
			data: {
				status: true,
				deactivated_by_leave_type: false
			}
		});
	});

	it('should not update leave policies if status is not changed', async () => {
		await update('test-cuid', { name: 'Sick Leave' });

		expect(mockTx.leaveType.update).toHaveBeenCalledWith({
			where: { cuid: 'test-cuid' },
			data: { name: 'Sick Leave' }
		});

		expect(mockTx.leavePolicy.updateMany).not.toHaveBeenCalled();
	});
});
