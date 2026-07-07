import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as leaveTypeDao from '$lib/server/dao/leave-type.dao.js';
import {
	createLeaveType,
	updateLeaveType,
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
					name: 12345,
					code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('name', 'Leave name is required')
			);
		});

		it('should reject empty name', async () => {
			await expect(
				createLeaveType({
					name: '   ',
					code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('name', 'Leave name is required')
			);
		});

		it('should reject short name (<= 5 chars)', async () => {
			await expect(
				createLeaveType({
					name: 'Sick',
					code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('name', 'Leave name must be more than 5 characters long')
			);
		});

		it('should reject long name (> 100 chars)', async () => {
			const longName = 'A'.repeat(101);
			await expect(
				createLeaveType({
					name: longName,
					code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('name', 'Leave name must be 100 characters or fewer')
			);
		});

		it('should reject names containing numbers or special characters', async () => {
			await expect(
				createLeaveType({
					name: 'Sick Leave 123',
					code: 'ANNUAL'
				})
			).rejects.toThrowError(
				new LeaveValidationError('name', 'Leave name can only contain letters and spaces')
			);
		});

		it('should reject non-string code', async () => {
			await expect(
				createLeaveType({
					name: 'Annual Leave',
					code: 123
				})
			).rejects.toThrowError(
				new LeaveValidationError('code', 'Leave code is required')
			);
		});

		it('should reject empty code', async () => {
			await expect(
				createLeaveType({
					name: 'Annual Leave',
					code: '   '
				})
			).rejects.toThrowError(
				new LeaveValidationError('code', 'Leave code is required')
			);
		});

		it('should reject long code (> 20 chars)', async () => {
			const longCode = 'A'.repeat(21);
			await expect(
				createLeaveType({
					name: 'Annual Leave',
					code: longCode
				})
			).rejects.toThrowError(
				new LeaveValidationError('code', 'Leave code must be 20 characters or fewer')
			);
		});

		it('should reject codes containing lowercase or special characters', async () => {
			await expect(
				createLeaveType({
					name: 'Annual Leave',
					code: 'Annual-1'
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'code',
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
					name: 'Sick Leave',
					code: 'SICK'
				});
				expect.fail('Should have thrown LeaveMultiValidationError');
			} catch (error: any) {
				expect(error).toBeInstanceOf(LeaveMultiValidationError);
				expect(error.fields).toEqual({
					name: 'Leave Name already exists',
					code: 'Leave Code already exists'
				});
			}
		});

		it('should successfully create leave type when valid', async () => {
			const input = {
				name: 'Annual Leave',
				code: 'ANNUAL',
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
					name: 'Valid Name'
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
					name: 'Conflicting Name'
				})
			).rejects.toThrowError(
				new LeaveMultiValidationError({ name: 'Leave Name already exists' })
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
					code: 'NEW_CODE'
				})
			).rejects.toThrowError(
				new LeaveMultiValidationError({ code: 'Leave Code already exists' })
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
				name: 'New Name',
				code: 'NEW_CODE',
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
