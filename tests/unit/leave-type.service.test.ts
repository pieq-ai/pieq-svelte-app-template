import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as leaveTypeDao from '$lib/server/dao/leave-type.dao.js';
import {
	createLeaveType,
	updateLeaveType,
	deleteLeaveType,
	listLeaveTypes,
	getLeaveTypeByCuid,
	LeaveValidationError,
	LeaveMultiValidationError
} from '$lib/server/services/leave-type.service.js';

vi.mock('$lib/server/dao/leave-type.dao.js', () => {
	return {
		list: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deleteLeaveType: vi.fn(),
		findByCuid: vi.fn(),
		findByName: vi.fn(),
		findByCode: vi.fn(),
		findDuplicateName: vi.fn(),
		findDuplicateCode: vi.fn()
	};
});

const auditFields = { created_at: new Date(), updated_at: new Date(), created_by: null, updated_by: null };

describe('leave type service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('creation and validation', () => {
		it('should reject non-string name', async () => {
			await expect(
				createLeaveType({
					leave_name: 12345,
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_name', 'Leave name is required')
			);
		});

		it('should reject empty name', async () => {
			await expect(
				createLeaveType({
					leave_name: '   ',
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_name', 'Leave name is required')
			);
		});

		it('should reject short name (<= 5 chars)', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Sick',
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_name', 'Leave name must be more than 5 characters long')
			);
		});

		it('should reject long name (> 100 chars)', async () => {
			const longName = 'A'.repeat(101);
			await expect(
				createLeaveType({
					leave_name: longName,
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_name', 'Leave name must be 100 characters or fewer')
			);
		});

		it('should reject names containing numbers or special characters', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Sick Leave 123',
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_name', 'Leave name can only contain letters and spaces')
			);
		});

		it('should reject non-string code', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: 123
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_code', 'Leave code is required')
			);
		});

		it('should reject empty code', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: '   '
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_code', 'Leave code is required')
			);
		});

		it('should reject long code (> 20 chars)', async () => {
			const longCode = 'A'.repeat(21);
			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: longCode
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_code', 'Leave code must be 20 characters or fewer')
			);
		});

		it('should reject codes containing lowercase or special characters', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: 'Annual-1'
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'leave_code',
					'Leave code can only contain uppercase letters and underscores'
				)
			);
		});

		it('should reject duplicate name or code during creation', async () => {
			const existing = { id: 1n, name: 'Sick Leave', code: 'SICK', ...auditFields };
			vi.mocked(leaveTypeDao.findByName).mockResolvedValue(existing as any);
			vi.mocked(leaveTypeDao.findByCode).mockResolvedValue(existing as any);

			try {
				await createLeaveType({
					leave_name: 'Sick Leave',
					leave_code: 'SICK'
				});
				expect.fail('Should have thrown LeaveMultiValidationError');
			} catch (error: any) {
				expect(error).toBeInstanceOf(LeaveMultiValidationError);
				expect(error.fields).toEqual({
					leave_name: 'Leave Name already exists',
					leave_code: 'Leave Code already exists'
				});
			}
		});

		it('should successfully create leave type when valid', async () => {
			const input = {
				leave_name: 'Annual Leave',
				leave_code: 'ANNUAL',
				description: 'Yearly holidays',
				is_paid: true,
				requires_approval: true,
				status: true
			};
			const expectedResult = {
				id: 1n,
				cuid: 'test-cuid',
				name: 'Annual Leave',
				code: 'ANNUAL',
				description: 'Yearly holidays',
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			};

			vi.mocked(leaveTypeDao.findByName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findByCode).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.create).mockResolvedValue(expectedResult as any);

			const result = await createLeaveType(input);

			expect(result).toEqual(expectedResult);
			expect(leaveTypeDao.create).toHaveBeenCalledWith({
				name: 'Annual Leave',
				code: 'ANNUAL',
				description: 'Yearly holidays',
				is_paid: true,
				requires_approval: true,
				status: true,
				created_by: undefined,
				updated_by: undefined
			});
		});
	});

	describe('updates', () => {
		const targetCuid = 'leave-type-cuid';

		it('should throw error when leave type to update is not found', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(null);

			await expect(
				updateLeaveType(targetCuid, {
					leave_name: 'Valid Name'
				})
			).rejects.toThrow('Leave type not found');
		});

		it('should reject update if the updated name conflicts with another leave type', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				cuid: targetCuid,
				name: 'Old Name',
				code: 'OLD_CODE',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true
			} as any);
			vi.mocked(leaveTypeDao.findDuplicateName).mockResolvedValue({
				id: 6n,
				cuid: 'another-cuid',
				name: 'Conflicting Name',
				code: 'CONF',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as any);

			await expect(
				updateLeaveType(targetCuid, {
					leave_name: 'Conflicting Name'
				})
			).rejects.toThrowError(
				new LeaveMultiValidationError({ leave_name: 'Leave Name already exists' })
			);
		});

		it('should reject update if the updated code conflicts with another leave type', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				cuid: targetCuid,
				name: 'Old Name',
				code: 'OLD_CODE',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true
			} as any);
			vi.mocked(leaveTypeDao.findDuplicateName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findDuplicateCode).mockResolvedValue({
				id: 7n,
				cuid: 'another-cuid',
				name: 'Conflicting Code Type',
				code: 'NEW_CODE',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as any);

			await expect(
				updateLeaveType(targetCuid, {
					leave_code: 'NEW_CODE'
				})
			).rejects.toThrowError(
				new LeaveMultiValidationError({ leave_code: 'Leave Code already exists' })
			);
		});

		it('should successfully update leave type', async () => {
			const existing = {
				cuid: targetCuid,
				name: 'Old Name',
				code: 'OLD_CODE',
				description: 'Old Description',
				is_paid: true,
				requires_approval: true,
				status: true
			};
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(existing as any);
			vi.mocked(leaveTypeDao.findDuplicateName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findDuplicateCode).mockResolvedValue(null);

			const expectedUpdated = {
				id: 5n,
				cuid: targetCuid,
				name: 'New Name',
				code: 'NEW_CODE',
				description: 'New Description',
				is_paid: false,
				requires_approval: false,
				status: false,
				...auditFields
			};
			vi.mocked(leaveTypeDao.update).mockResolvedValue(expectedUpdated as any);

			const result = await updateLeaveType(targetCuid, {
				leave_name: 'New Name',
				leave_code: 'NEW_CODE',
				description: 'New Description',
				is_paid: false,
				requires_approval: false,
				status: false
			});

			expect(result).toEqual(expectedUpdated);
			expect(leaveTypeDao.update).toHaveBeenCalledWith(targetCuid, {
				name: 'New Name',
				code: 'NEW_CODE',
				description: 'New Description',
				is_paid: false,
				requires_approval: false,
				status: false,
				updated_by: undefined
			});
		});
	});

	describe('deletions', () => {
		const targetCuid = 'leave-type-cuid';

		it('should throw error when leave type to delete is not found', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(null);

			await expect(deleteLeaveType(targetCuid)).rejects.toThrow('Leave type not found');
		});

		it('should successfully delete a leave type when it exists', async () => {
			const existing = {
				cuid: targetCuid,
				name: 'Annual Leave',
				code: 'ANNUAL',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true
			};
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(existing as any);
			vi.mocked(leaveTypeDao.deleteLeaveType).mockResolvedValue({ id: 8n, ...existing, ...auditFields } as any);

			const result = await deleteLeaveType(targetCuid);

			expect(result).toEqual({ id: 8n, ...existing, ...auditFields });
			expect(leaveTypeDao.deleteLeaveType).toHaveBeenCalledWith(targetCuid);
		});
	});

	describe('retrieval', () => {
		it('should call list from DAO', async () => {
			const mockList = [{ cuid: '1', name: 'Annual', code: 'ANN' }];
			vi.mocked(leaveTypeDao.list).mockResolvedValue(mockList as any);

			const result = await listLeaveTypes();
			expect(result).toBe(mockList);
			expect(leaveTypeDao.list).toHaveBeenCalledOnce();
		});

		it('should call findByCuid from DAO', async () => {
			const mockItem = { cuid: '1', name: 'Annual', code: 'ANN' };
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(mockItem as any);

			const result = await getLeaveTypeByCuid('1');
			expect(result).toBe(mockItem);
			expect(leaveTypeDao.findByCuid).toHaveBeenCalledWith('1');
		});
	});
});
