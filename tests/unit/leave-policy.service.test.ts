import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '$lib/server/db.js';
import * as leavePolicyDao from '$lib/server/dao/leave-policy.dao.js';
import {
	createLeavePolicy,
	updateLeavePolicy,
	deleteLeavePolicy
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError, LeaveMultiValidationError } from '$lib/server/services/leave-type.service.js';
import type { LeaveType, EmploymentType, LeavePolicy } from '$lib/generated/prisma/client.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			leaveType: {
				findUnique: vi.fn()
			},
			employmentType: {
				findUnique: vi.fn()
			}
		}
	};
});

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
			document_required: false,
			min_service_days: 30,
			allow_half_day: true,
			gender_specific: true,
			applicable_gender: 'Female',
			status: true
		};

		// 1. Leave Type Validations
		it('should reject missing or empty leave_type_cuid', async () => {
			await expect(
				createLeavePolicy({
					...validBaseInput,
					leave_type_cuid: ''
				})
			).rejects.toThrowError(new LeaveValidationError('leave_type_cuid', 'Leave type is required'));
		});

		it('should reject when leave type does not exist', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue(null);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError('leave_type_cuid', 'Selected leave type does not exist')
			);
		});

		it('should reject when leave type is inactive', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual Leave',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: false, // inactive
				...auditFields
			} as unknown as LeaveType);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError('leave_type_cuid', 'Selected leave type is inactive')
			);
		});

		// 2. Employment Type Validations
		it('should reject missing or empty employment_type_cuids', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					employment_type_cuids: null
				})
			).rejects.toThrowError(
				new LeaveValidationError('employment_type_cuids', 'At least one employment type is required')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					employment_type_cuids: []
				})
			).rejects.toThrowError(
				new LeaveValidationError('employment_type_cuids', 'At least one employment type is required')
			);
		});

		it('should reject when an employment type does not exist', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue(null);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError('employment_type_cuids', 'Employment type emp-type-1 does not exist')
			);
		});

		it('should reject when an employment type is inactive', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: false, // inactive
				...auditFields
			} as unknown as EmploymentType);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveValidationError(
					'employment_type_cuids',
					"Employment type 'Part Time' is inactive"
				)
			);
		});

		// 3. Quota Validations
		it('should reject missing or invalid annual_limit', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);

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
				new LeaveValidationError('annual_limit', 'Annual limit must be greater than zero')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					annual_limit: 'invalid-num'
				})
			).rejects.toThrowError(
				new LeaveValidationError('annual_limit', 'Annual limit must be greater than zero')
			);
		});

		// 4. Max Per Month Validations
		it('should reject negative max_per_month or exceeding annual limit', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					max_per_month: -1
				})
			).rejects.toThrowError(
				new LeaveValidationError('max_per_month', 'Max per month must be greater than zero')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					max_per_month: 20 // annual limit is 15
				})
			).rejects.toThrowError(
				new LeaveValidationError('max_per_month', 'Max per month cannot exceed annual limit')
			);
		});

		// 5. Carry Forward Validations
		it('should reject missing or invalid max_carry_forward_days when carry forward is allowed', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);

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
					max_carry_forward_days: -2
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_carry_forward_days',
					'Max carry forward days must be greater than zero'
				)
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: true,
					max_carry_forward_days: 0
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_carry_forward_days',
					'Max carry forward days must be greater than zero'
				)
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					carry_forward_allowed: false,
					max_carry_forward_days: 5
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'max_carry_forward_days',
					'Max carry forward days must be empty when carry forward is not allowed'
				)
			);
		});

		it('should allow max_carry_forward_days to exceed annual quota when carry forward is allowed', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);
			vi.mocked(leavePolicyDao.findActivePolicyForEmploymentType).mockResolvedValue(null);

			const expectedOutput = {
				id: 1n,
				cuid: 'policy-cuid',
				leave_type_cuid: 'leave-type-1',
				annual_limit: 15,
				max_per_month: 2,
				carry_forward_allowed: true,
				max_carry_forward_days: 20, // exceeds annual limit of 15
				document_required: false,
				document_required_after_days: null,
				min_service_days: 30,
				allow_half_day: true,
				gender_specific: true,
				applicable_gender: 'Female',
				status: true,
				employment_type_cuids: ['emp-type-1'],
				...auditFields
			};

			vi.mocked(leavePolicyDao.create).mockResolvedValue(expectedOutput);

			const result = await createLeavePolicy({
				...validBaseInput,
				carry_forward_allowed: true,
				max_carry_forward_days: 20
			});

			expect(result).toEqual(expectedOutput);
		});

		// 6. Min Service Days Validations
		it('should reject non-integer or negative min_service_days', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					min_service_days: -10
				})
			).rejects.toThrowError(
				new LeaveValidationError('min_service_days', 'Min service days must be a positive integer')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					min_service_days: 10.5
				})
			).rejects.toThrowError(
				new LeaveValidationError('min_service_days', 'Min service days must be a positive integer')
			);
		});

		// 6.5. Document Required After Days Validations
		it('should reject document_required_after_days when document_required is false', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);

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

		it('should reject invalid document_required_after_days when document_required is true', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					document_required: true,
					document_required_after_days: -1
				})
			).rejects.toThrowError(
				new LeaveValidationError('document_required_after_days', 'Document required after days must be greater than zero')
			);

			await expect(
				createLeavePolicy({
					...validBaseInput,
					document_required: true,
					document_required_after_days: 1.5
				})
			).rejects.toThrowError(
				new LeaveValidationError('document_required_after_days', 'Document required after days must be greater than zero')
			);
		});

		// 7. Gender Specific Validations
		it('should reject missing or invalid applicable_gender when gender specific is enabled', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);

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

			await expect(
				createLeavePolicy({
					...validBaseInput,
					gender_specific: true,
					applicable_gender: 'UnknownGender'
				})
			).rejects.toThrowError(
				new LeaveValidationError(
					'applicable_gender',
					'Applicable gender must be Male, Female, or Others'
				)
			);
		});

		// 8. Active Policy Check Validations
		it('should reject when a policy already exists for the selected active employment type', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);
			vi.mocked(leavePolicyDao.findActivePolicyForEmploymentType).mockResolvedValue({
				id: 10n,
				cuid: 'existing-policy-cuid',
				leave_type_cuid: 'leave-type-1',
				annual_limit: 15,
				max_per_month: null,
				carry_forward_allowed: false,
				max_carry_forward_days: null,
				document_required: false,
				min_service_days: 0,
				allow_half_day: false,
				gender_specific: false,
				applicable_gender: null,
				status: true,
				...auditFields
			} as unknown as LeavePolicy);

			await expect(createLeavePolicy(validBaseInput)).rejects.toThrowError(
				new LeaveMultiValidationError({
					employment_type_cuids: 'Leave Policy already exists for this employment type and leave type'
				})
			);
		});

		// 9. Successful creation
		it('should successfully create policy when validation passes', async () => {
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);
			vi.mocked(leavePolicyDao.findActivePolicyForEmploymentType).mockResolvedValue(null);

			const expectedOutput = {
				id: 1n,
				cuid: 'policy-cuid',
				leave_type_cuid: 'leave-type-1',
				annual_limit: 15,
				max_per_month: 2,
				carry_forward_allowed: true,
				max_carry_forward_days: 5,
				document_required: false,
				document_required_after_days: null,
				min_service_days: 30,
				allow_half_day: true,
				gender_specific: true,
				applicable_gender: 'Female',
				status: true,
				employment_type_cuids: ['emp-type-1'],
				...auditFields
			};

			vi.mocked(leavePolicyDao.create).mockResolvedValue(expectedOutput);

			const result = await createLeavePolicy(validBaseInput);

			expect(result).toEqual(expectedOutput);
			expect(leavePolicyDao.create).toHaveBeenCalledWith(
				{
					leave_type_cuid: 'leave-type-1',
					annual_limit: 15,
					max_per_month: 2,
					carry_forward_allowed: true,
					max_carry_forward_days: 5,
					document_required: false,
					document_required_after_days: null,
					min_service_days: 30,
					allow_half_day: true,
					gender_specific: true,
					applicable_gender: 'Female',
					status: true
				},
				['emp-type-1']
			);
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

			vi.mocked(leavePolicyDao.findByCuid).mockResolvedValue(existingPolicy);
			vi.mocked(db.leaveType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'leave-type-1',
				leave_name: 'Annual',
				leave_code: 'ANN',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true,
				...auditFields
			} as unknown as LeaveType);
			vi.mocked(db.employmentType.findUnique).mockResolvedValue({
				id: 1n,
				cuid: 'emp-type-1',
				name: 'Part Time',
				status: true,
				...auditFields
			} as unknown as EmploymentType);
			vi.mocked(leavePolicyDao.findActivePolicyForEmploymentType).mockResolvedValue(null);

			const expectedOutput = {
				...existingPolicy,
				annual_limit: 20,
				carry_forward_allowed: true,
				max_carry_forward_days: 5,
				...auditFields
			};

			vi.mocked(leavePolicyDao.update).mockResolvedValue(expectedOutput);

			const result = await updateLeavePolicy(targetCuid, {
				annual_limit: 20,
				carry_forward_allowed: true,
				max_carry_forward_days: 5
			});

			expect(result).toEqual(expectedOutput);
			expect(leavePolicyDao.update).toHaveBeenCalledWith(
				targetCuid,
				{
					leave_type_cuid: 'leave-type-1',
					annual_limit: 20,
					max_per_month: null,
					carry_forward_allowed: true,
					max_carry_forward_days: 5,
					document_required: false,
					document_required_after_days: null,
					min_service_days: 0,
					allow_half_day: false,
					gender_specific: false,
					applicable_gender: null,
					status: true
				},
				['emp-type-1']
			);
		});
	});

	describe('deletions', () => {
		const targetCuid = 'policy-cuid';

		it('should successfully delete a policy when it exists', async () => {
			const existing = {
				id: 1n,
				cuid: targetCuid,
				leave_type_cuid: 'leave-type-1',
				annual_limit: 10,
				max_per_month: null,
				carry_forward_allowed: false,
				max_carry_forward_days: null,
				document_required: false,
				min_service_days: 0,
				allow_half_day: false,
				gender_specific: false,
				applicable_gender: null,
				status: true,
				...auditFields
			} as unknown as LeavePolicy;
			vi.mocked(leavePolicyDao.deletePolicy).mockResolvedValue(existing);

			const result = await deleteLeavePolicy(targetCuid);

			expect(result).toEqual(existing);
			expect(leavePolicyDao.deletePolicy).toHaveBeenCalledWith(targetCuid);
		});
	});
});
