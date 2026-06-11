import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as leaveTypeDao from '$lib/server/dao/leave-type.dao.js';
import {
	createLeaveType,
	updateLeaveType,
	deleteLeaveType,
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
		// Name checks
		it('should reject non-string name', async () => {
			await expect(
				createLeaveType({
					leave_name: 12345,
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_name', 'Leave name is required and must be a string')
			);
		});

		it('should reject empty name', async () => {
			await expect(
				createLeaveType({
					leave_name: '   ',
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_name', 'Leave name cannot be empty')
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

		// Code checks
		it('should reject non-string code', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: 123
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_code', 'Leave code is required and must be a string')
			);
		});

		it('should reject empty code', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: '   '
				})
			).rejects.toThrowError(
				new LeaveValidationError('leave_code', 'Leave code cannot be empty')
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

		it('should reject code containing spaces or special characters', async () => {
			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: 'ANNUAL CODE'
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'leave_code',
					'Leave code can only contain uppercase letters and underscores'
				)
			);
		});

		// Duplicate checks
		it('should reject creation if name already exists', async () => {
			vi.mocked(leaveTypeDao.findByName).mockResolvedValue({
				id: 1n,
				cuid: 'cuid-1',
				leave_name: 'Annual Leave',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			});

			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: 'ANNUAL'
				})
			).rejects.toThrowError(new LeaveMultiValidationError({ leave_name: 'Leave name already exists' }));
		});

		it('should reject creation if code already exists', async () => {
			vi.mocked(leaveTypeDao.findByName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findByCode).mockResolvedValue({
				id: 2n,
				cuid: 'cuid-1',
				leave_name: 'Other Leave',
				leave_code: 'ANNUAL',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			});

			await expect(
				createLeaveType({
					leave_name: 'Annual Leave',
					leave_code: 'annual'
				})
			).rejects.toThrowError(new LeaveMultiValidationError({ leave_code: 'Leave code already exists' }));
		});

		it('should successfully create leave type with default settings', async () => {
			vi.mocked(leaveTypeDao.findByName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findByCode).mockResolvedValue(null);
			const expectedResult = {
				id: 3n,
				cuid: 'new-cuid',
				leave_name: 'Annual Leave',
				leave_code: 'ANNUAL',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			};
			vi.mocked(leaveTypeDao.create).mockResolvedValue(expectedResult);

			const result = await createLeaveType({
				leave_name: 'Annual Leave',
				leave_code: 'ANNUAL'
			});

			expect(result).toEqual(expectedResult);
			expect(leaveTypeDao.create).toHaveBeenCalledWith({
				leave_name: 'Annual Leave',
				leave_code: 'ANNUAL',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true
			});
		});

		it('should successfully create leave type with custom values', async () => {
			vi.mocked(leaveTypeDao.findByName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findByCode).mockResolvedValue(null);
			const expectedResult = {
				id: 4n,
				cuid: 'new-cuid',
				leave_name: 'Sick Leave',
				leave_code: 'SICK_LEAVE',
				description: 'Custom description',
				is_paid: false,
				requires_approval: false,
				status: false,
				...auditFields
			};
			vi.mocked(leaveTypeDao.create).mockResolvedValue(expectedResult);

			const result = await createLeaveType({
				leave_name: 'Sick Leave',
				leave_code: 'SICK_LEAVE',
				description: '  Custom description  ',
				is_paid: false,
				requires_approval: false,
				status: false
			});

			expect(result).toEqual(expectedResult);
			expect(leaveTypeDao.create).toHaveBeenCalledWith({
				leave_name: 'Sick Leave',
				leave_code: 'SICK_LEAVE',
				description: 'Custom description',
				is_paid: false,
				requires_approval: false,
				status: false
			});
		});
	});

	describe('updates', () => {
		const targetCuid = 'leave-type-cuid';

		it('should throw error when leave type is not found', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(null);

			await expect(
				updateLeaveType(targetCuid, {
					leave_name: 'Valid Name'
				})
			).rejects.toThrow('Leave type not found');
		});

		it('should reject update if the updated name conflicts with another leave type', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 5n,
				cuid: targetCuid,
				leave_name: 'Old Name',
				leave_code: 'OLD_CODE',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			});
			vi.mocked(leaveTypeDao.findDuplicateName).mockResolvedValue({
				id: 6n,
				cuid: 'another-cuid',
				leave_name: 'Conflicting Name',
				leave_code: 'CONF',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			});

			await expect(
				updateLeaveType(targetCuid, {
					leave_name: 'Conflicting Name'
				})
			).rejects.toThrowError(new LeaveMultiValidationError({ leave_name: 'Leave name already exists' }));
		});

		it('should reject update if the updated code conflicts with another leave type', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 5n,
				cuid: targetCuid,
				leave_name: 'Old Name',
				leave_code: 'OLD_CODE',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			});
			vi.mocked(leaveTypeDao.findDuplicateName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findDuplicateCode).mockResolvedValue({
				id: 7n,
				cuid: 'another-cuid',
				leave_name: 'Conflicting Code Type',
				leave_code: 'NEW_CODE',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			});

			await expect(
				updateLeaveType(targetCuid, {
					leave_code: 'NEW_CODE'
				})
			).rejects.toThrowError(new LeaveMultiValidationError({ leave_code: 'Leave code already exists' }));
		});

		it('should successfully update leave type', async () => {
			const existing = {
				id: 5n,
				cuid: targetCuid,
				leave_name: 'Old Name',
				leave_code: 'OLD_CODE',
				description: 'Old Description',
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			};
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(existing);
			vi.mocked(leaveTypeDao.findDuplicateName).mockResolvedValue(null);
			vi.mocked(leaveTypeDao.findDuplicateCode).mockResolvedValue(null);

			const expectedUpdated = {
				id: 5n,
				cuid: targetCuid,
				leave_name: 'New Name',
				leave_code: 'NEW_CODE',
				description: 'New Description',
				is_paid: false,
				requires_approval: false,
				status: false,
				...auditFields
			};
			vi.mocked(leaveTypeDao.update).mockResolvedValue(expectedUpdated);

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
				leave_name: 'New Name',
				leave_code: 'NEW_CODE',
				description: 'New Description',
				is_paid: false,
				requires_approval: false,
				status: false
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
				id: 8n,
				cuid: targetCuid,
				leave_name: 'Annual Leave',
				leave_code: 'ANNUAL',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			};
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(existing);
			vi.mocked(leaveTypeDao.deleteLeaveType).mockResolvedValue(existing);

			const result = await deleteLeaveType(targetCuid);

			expect(result).toEqual(existing);
			expect(leaveTypeDao.deleteLeaveType).toHaveBeenCalledWith(targetCuid);
		});
	});
});
