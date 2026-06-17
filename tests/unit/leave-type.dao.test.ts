import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	list,
	create,
	update,
	deleteLeaveType,
	findByCuid,
	findByName,
	findByCode,
	findDuplicateName,
	findDuplicateCode
} from '$lib/server/dao/leave-type.dao.js';
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
			$transaction: vi.fn((callback) => callback(mockTx)),
			leaveType: {
				findMany: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				findUnique: vi.fn(),
				findFirst: vi.fn()
			},
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

	it('should list leave types with select options', async () => {
		const mockList = [{ cuid: '1', name: 'Annual', code: 'ANN' }];
		vi.mocked(db.leaveType.findMany).mockResolvedValue(mockList as any);

		const result = await list();
		expect(result).toBe(mockList);
		expect(db.leaveType.findMany).toHaveBeenCalledWith({
			select: {
				cuid: true,
				name: true,
				code: true,
				description: true,
				is_paid: true,
				requires_approval: true,
				status: true
			},
			orderBy: { updated_at: 'desc' }
		});
	});

	it('should create a leave type', async () => {
		const data = {
			name: 'Sick Leave',
			code: 'SICK',
			description: 'Medical',
			is_paid: true,
			requires_approval: true,
			status: true
		};
		vi.mocked(db.leaveType.create).mockResolvedValue({ id: 1n, ...data } as any);

		const result = await create(data);
		expect(result).toEqual({ id: 1n, ...data });
		expect(db.leaveType.create).toHaveBeenCalledWith({ data });
	});

	it('should update leave type status and set deactivated_by_leave_type flag to true when deactivated in transaction', async () => {
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

	it('should update leave type status and restore policies when reactivated in transaction', async () => {
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

	it('should delete a leave type', async () => {
		const mockResult = { id: 1n, cuid: 'test-cuid' };
		vi.mocked(db.leaveType.delete).mockResolvedValue(mockResult as any);

		const result = await deleteLeaveType('test-cuid');
		expect(result).toBe(mockResult);
		expect(db.leaveType.delete).toHaveBeenCalledWith({ where: { cuid: 'test-cuid' } });
	});

	it('should find by cuid', async () => {
		const mockResult = { cuid: 'test-cuid', name: 'Sick Leave' };
		vi.mocked(db.leaveType.findUnique).mockResolvedValue(mockResult as any);

		const result = await findByCuid('test-cuid');
		expect(result).toBe(mockResult);
		expect(db.leaveType.findUnique).toHaveBeenCalledWith({
			where: { cuid: 'test-cuid' },
			select: {
				cuid: true,
				name: true,
				code: true,
				description: true,
				is_paid: true,
				requires_approval: true,
				status: true
			}
		});
	});

	it('should find by name (case-insensitive)', async () => {
		const mockResult = { id: 1n, name: 'Sick Leave' };
		vi.mocked(db.leaveType.findFirst).mockResolvedValue(mockResult as any);

		const result = await findByName('Sick Leave');
		expect(result).toBe(mockResult);
		expect(db.leaveType.findFirst).toHaveBeenCalledWith({
			where: {
				name: {
					equals: 'Sick Leave',
					mode: 'insensitive'
				}
			}
		});
	});

	it('should find by code (case-insensitive)', async () => {
		const mockResult = { id: 1n, code: 'SICK' };
		vi.mocked(db.leaveType.findFirst).mockResolvedValue(mockResult as any);

		const result = await findByCode('sick');
		expect(result).toBe(mockResult);
		expect(db.leaveType.findFirst).toHaveBeenCalledWith({
			where: {
				code: {
					equals: 'sick',
					mode: 'insensitive'
				}
			}
		});
	});

	it('should find duplicate name excluding cuid', async () => {
		const mockResult = { id: 2n, name: 'Casual Leave' };
		vi.mocked(db.leaveType.findFirst).mockResolvedValue(mockResult as any);

		const result = await findDuplicateName('Casual Leave', 'exclude-cuid');
		expect(result).toBe(mockResult);
		expect(db.leaveType.findFirst).toHaveBeenCalledWith({
			where: {
				name: {
					equals: 'Casual Leave',
					mode: 'insensitive'
				},
				NOT: { cuid: 'exclude-cuid' }
			}
		});
	});

	it('should find duplicate code excluding cuid', async () => {
		const mockResult = { id: 2n, code: 'CASUAL' };
		vi.mocked(db.leaveType.findFirst).mockResolvedValue(mockResult as any);

		const result = await findDuplicateCode('CASUAL', 'exclude-cuid');
		expect(result).toBe(mockResult);
		expect(db.leaveType.findFirst).toHaveBeenCalledWith({
			where: {
				code: {
					equals: 'CASUAL',
					mode: 'insensitive'
				},
				NOT: { cuid: 'exclude-cuid' }
			}
		});
	});
});
