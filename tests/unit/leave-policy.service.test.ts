import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as leavePolicyDao from '$lib/server/dao/leave-policy.dao.js';
import * as leaveTypeDao from '$lib/server/dao/leave-type.dao.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';
import {
	createLeavePolicy,
	updateLeavePolicy,
	deleteLeavePolicy
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError, LeaveMultiValidationError } from '$lib/server/services/leave-type.service.js';

vi.mock('$lib/server/dao/leave-type.dao.js', () => ({
	findByCuid: vi.fn(),
	findByName: vi.fn(),
	findByCode: vi.fn(),
	findDuplicateName: vi.fn(),
	findDuplicateCode: vi.fn()
}));

vi.mock('$lib/server/dao/master-data.dao.js', () => ({
	findByCuid2: vi.fn()
}));

vi.mock('$lib/server/dao/leave-policy.dao.js', () => {
	return {
		list: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deletePolicy: vi.fn(),
		findByCuid: vi.fn(),
		findActivePolicyForEmploymentType: vi.fn()
	};
});

const auditFields = { created_at: new Date(), updated_at: new Date(), deactivated_by_leave_type: false, created_by: null, updated_by: null };

describe('leave policy service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('creation and validation', () => {
		const validBaseInput = {
			leave_type_cuid: 'leave-type-1',
			employment_type_cuids: ['emp-type-1'],
			annual_limit: 15,
			max_per_month: 2,
			carry_forward_allowed: true,
			max_carry_forward_days: 5,
			max_annual_carry_forward_days: 3,
			document_required: false,
			min_service_days: 30,
			allow_half_day: true,
			gender_specific: true,
			applicable_gender: 'Female',
			status: true
		};

		it('should reject missing or empty leave_type_cuid', async () => {
			await expect(
				createLeavePolicy({
					...validBaseInput,
					leave_type_cuid: ''
				})
			).rejects.toThrowError(new LeaveValidationError('leave_type_cuid', 'Leave type is required'));
		});

		it('should reject when leave type does not exist', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue(null);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError('leave_type_cuid', 'Selected leave type does not exist')
			);
		});

		it('should reject when leave type is inactive', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				name: 'Annual Leave',
				code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: false,
				...auditFields
			} as any);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError('leave_type_cuid', 'Selected leave type is inactive')
			);
		});

		it('should reject missing or empty employment_type_cuids', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				name: 'Annual',
				code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as any);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					employment_type_cuids: null
				})
			).rejects.toThrowError(
				new LeaveValidationError('employment_type_cuids', 'At least one employment type is required')
			);
		});

		it('should reject when an employment type does not exist', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				name: 'Annual',
				code: 'ANN',
				status: true,
				...auditFields
			} as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue(null);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError('employment_type_cuids', 'Employment type emp-type-1 does not exist')
			);
		});

		it('should reject when an employment type is inactive', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				status: true,
				...auditFields
			} as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: false, // inactive
				...auditFields
			} as any);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError(
					'employment_type_cuids',
					"Employment type 'Part Time' is inactive"
				)
			);
		});

		it('should reject missing or invalid annual_limit', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 1n,
				status: true,
				...auditFields
			} as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as any);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					annual_limit: ''
				})
			).rejects.toThrowError(new LeaveValidationError('annual_limit', 'Annual limit is required'));

			await expect(
				createLeavePolicy({
					...validBaseInput,
					annual_limit: -5
				})
			).rejects.toThrowError(
				new LeaveValidationError('annual_limit', 'Value must be greater than 0')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					annual_limit: 0
				})
			).rejects.toThrowError(
				new LeaveValidationError('annual_limit', 'Value must be greater than 0')
			);
		});

		it('should reject negative max_per_month or exceeding annual limit', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({
				id: 1n,
				status: true,
				...auditFields
			} as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as any);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					max_per_month: -1
				})
			).rejects.toThrowError(
				new LeaveValidationError('max_per_month', 'Value must be greater than 0')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					max_per_month: 0
				})
			).rejects.toThrowError(
				new LeaveValidationError('max_per_month', 'Value must be greater than 0')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					max_per_month: 20
				})
			).rejects.toThrowError(
				new LeaveValidationError('max_per_month', 'Max per month cannot exceed annual limit')
			);
		});

		it('should reject carry forward rules mismatch', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: true,
					max_carry_forward_days: null
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_carry_forward_days',
					'Max carry forward days is required when carry forward is allowed'
				)
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: true,
					max_annual_carry_forward_days: null
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_annual_carry_forward_days',
					'Max annual carry forward days is required when carry forward is allowed'
				)
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: true,
					max_annual_carry_forward_days: -2
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_annual_carry_forward_days',
					'Value must be greater than 0'
				)
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: true,
					max_carry_forward_days: 5,
					max_annual_carry_forward_days: 6
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_annual_carry_forward_days',
					'Max annual carry forward days cannot exceed max carry forward days'
				)
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: false,
					max_carry_forward_days: 5,
					max_annual_carry_forward_days: null
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_carry_forward_days',
					'Max carry forward days must be empty when carry forward is not allowed'
				)
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: false,
					max_carry_forward_days: null,
					max_annual_carry_forward_days: 3
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_annual_carry_forward_days',
					'Max annual carry forward days must be empty when carry forward is not allowed'
				)
			);
		});

		it('should reject negative or non-integer min_service_days', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					min_service_days: -10
				})
			).rejects.toThrowError(
				new LeaveValidationError('min_service_days', 'Value must be greater than or equal to 0')
			);
		});

		it('should reject document rules mismatch', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					document_required: false,
					document_required_after_days: 3
				})
			).rejects.toThrowError(
				new LeaveValidationError('document_required_after_days', 'Document required after days must be empty when document upload is not required')
			);
		});

		it('should reject gender rules mismatch', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					gender_specific: true,
					applicable_gender: ''
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'applicable_gender',
					'Applicable gender is required when gender specific is enabled'
				)
			);
		});

		it('should reject duplicate policy for same leave type and employment type', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(leavePolicyDao.findActivePolicyForEmploymentType).mockResolvedValue({ cuid: 'existing' } as any);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveMultiValidationError({
					employment_type_cuids: 'Leave Policy already exists for this employment type and leave type'
				})
			);
		});

		it('should successfully create policy when validation passes', async () => {
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(leavePolicyDao.findActivePolicyForEmploymentType).mockResolvedValue(null);

			const expectedOutput = {
				id: 1n,
				cuid: 'policy-cuid',
				leave_type_cuid: 'leave-type-1',
				annual_limit: 15,
				employment_type_cuids: ['emp-type-1'],
				...auditFields
			};
			vi.mocked(leavePolicyDao.create).mockResolvedValue(expectedOutput as any);

			const result = await createLeavePolicy(validBaseInput);
			expect(result).toEqual(expectedOutput);
		});
	});

	describe('updates', () => {
		const targetCuid = 'policy-cuid';

		it('should throw error when leave policy to update is not found', async () => {
			vi.mocked(leavePolicyDao.findByCuid).mockResolvedValue(null);

			await expect(
				updateLeavePolicy(targetCuid, {
					annual_limit: 20
				})
			).rejects.toThrow('Leave policy not found');
		});

		it('should successfully update policy and map changes', async () => {
			const existingPolicy = {
				id: 1n,
				cuid: targetCuid,
				leave_type_cuid: 'leave-type-1',
				annual_limit: 15,
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
				employment_type_cuids: ['emp-type-1'],
				...auditFields
			};

			vi.mocked(leavePolicyDao.findByCuid).mockResolvedValue(existingPolicy as any);
			vi.mocked(leaveTypeDao.findByCuid).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1n, status: true, ...auditFields } as any);
			vi.mocked(leavePolicyDao.findActivePolicyForEmploymentType).mockResolvedValue(null);

			const expectedOutput = {
				...existingPolicy,
				annual_limit: 20,
				carry_forward_allowed: true,
				max_carry_forward_days: 5,
				max_annual_carry_forward_days: 3,
				...auditFields
			};
			vi.mocked(leavePolicyDao.update).mockResolvedValue(expectedOutput as any);

			const result = await updateLeavePolicy(targetCuid, {
				annual_limit: 20,
				carry_forward_allowed: true,
				max_carry_forward_days: 5,
				max_annual_carry_forward_days: 3
			});

			expect(result).toEqual(expectedOutput);
		});
	});

	describe('deletions', () => {
		it('should successfully delete a policy', async () => {
			const existing = { cuid: 'policy-1', annual_limit: 10 } as any;
			vi.mocked(leavePolicyDao.deletePolicy).mockResolvedValue(existing);

			const result = await deleteLeavePolicy('policy-1');
			expect(result).toEqual(existing);
			expect(leavePolicyDao.deletePolicy).toHaveBeenCalledWith('policy-1');
		});
	});
});
