import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as leaveDao from '$lib/server/dao/leave.dao.js';
import { db } from '$lib/server/db.js';
import { ValidationError } from '$lib/server/utils/errors.js';

vi.mock('$lib/server/db.js', () => {
	const mockDb = {
		employee: {
			findFirst: vi.fn(),
			findUnique: vi.fn()
		},
		employment: {
			findFirst: vi.fn()
		},
		leaveType: {
			findFirst: vi.fn(),
			findUnique: vi.fn()
		},
		leavePolicy: {
			findFirst: vi.fn()
		},
		leaveBalance: {
			findUnique: vi.fn(),
			update: vi.fn()
		},
		leaveRequest: {
			findUnique: vi.fn(),
			update: vi.fn()
		},
		attendanceRecord: {
			findUnique: vi.fn(),
			upsert: vi.fn()
		},
		$transaction: vi.fn()
	};
	return { db: mockDb };
});

vi.mock('$lib/server/dao/leave.dao.js', () => {
	return {
		listLeaveTypes: vi.fn(),
		getLeaveTypeByCuid: vi.fn(),
		listLeavePolicies: vi.fn(),
		getLeavePolicyByLeaveType: vi.fn(),
		getLeavePolicyEmploymentTypes: vi.fn(),
		getLeaveBalances: vi.fn(),
		getLeaveBalance: vi.fn(),
		createLeaveBalance: vi.fn(),
		updateLeaveBalance: vi.fn(),
		getLeaveRequests: vi.fn(),
		getLeaveRequestByCuid: vi.fn(),
		createLeaveRequest: vi.fn(),
		updateLeaveRequest: vi.fn(),
		getOverlappingRequests: vi.fn(),
		upsertAttendanceRecord: vi.fn()
	};
});

describe('Leave Service Unit Tests', () => {
	const mockEmployee = {
		id: 1n,
		cuid: 'emp-cuid',
		emp_code: 'EMP001',
		first_name: 'John',
		last_name: 'Doe',
		gender: 'Male',
		personal_email: 'john.personal@example.com'
	};

	const mockEmployment = {
		id: 1n,
		cuid: 'empl-cuid',
		employee_cuid: 'emp-cuid',
		official_email: 'john@pieq.ai',
		employment_status: 'active',
		employment_type_cuid: 'perm-type-cuid',
		date_of_joining: new Date('2025-01-01T00:00:00.000Z')
	};

	const mockLeaveTypes = [
		{ cuid: 'cuid-cl', leave_code: 'CL', leave_name: 'Casual Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-sl', leave_code: 'SL', leave_name: 'Sick Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-el', leave_code: 'EL', leave_name: 'Earned Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-ml', leave_code: 'ML', leave_name: 'Maternity Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-pl', leave_code: 'PL', leave_name: 'Paternity Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-lwp', leave_code: 'LWP', leave_name: 'Leave Without Pay', is_paid: false, requires_approval: true }
	];

	const mockPolicies = {
		'cuid-cl': { cuid: 'p-cl', leave_type_cuid: 'cuid-cl', annual_limit: 6, max_per_month: 2, carry_forward_allowed: false, min_service_days: 0, allow_half_day: true, gender_specific: false, status: true },
		'cuid-sl': { cuid: 'p-sl', leave_type_cuid: 'cuid-sl', annual_limit: 6, max_per_month: 2, carry_forward_allowed: false, min_service_days: 0, allow_half_day: true, gender_specific: false, status: true },
		'cuid-el': { cuid: 'p-el', leave_type_cuid: 'cuid-el', annual_limit: 12, max_per_month: 1, carry_forward_allowed: true, min_service_days: 365, allow_half_day: false, gender_specific: false, status: true },
		'cuid-ml': { cuid: 'p-ml', leave_type_cuid: 'cuid-ml', annual_limit: 180, max_per_month: null, carry_forward_allowed: false, min_service_days: 80, allow_half_day: false, gender_specific: true, applicable_gender: 'Female', status: true },
		'cuid-pl': { cuid: 'p-pl', leave_type_cuid: 'cuid-pl', annual_limit: 5, max_per_month: null, carry_forward_allowed: false, min_service_days: 0, allow_half_day: false, gender_specific: true, applicable_gender: 'Male', status: true },
		'cuid-lwp': { cuid: 'p-lwp', leave_type_cuid: 'cuid-lwp', annual_limit: 365, max_per_month: null, carry_forward_allowed: false, min_service_days: 0, allow_half_day: true, gender_specific: false, status: true }
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Default DB mocks
		vi.mocked(db.employment.findFirst).mockResolvedValue(mockEmployment as any);
		vi.mocked(db.employee.findUnique).mockResolvedValue(mockEmployee as any);
		vi.mocked(db.employee.findFirst).mockResolvedValue(mockEmployee as any);
		vi.mocked(db.$transaction).mockImplementation(async (cb) => cb(db));

		// Default DAO mocks
		vi.mocked(leaveDao.listLeaveTypes).mockResolvedValue(mockLeaveTypes as any);
		vi.mocked(leaveDao.getLeaveTypeByCuid).mockImplementation(async (cuid) => {
			return mockLeaveTypes.find(t => t.cuid === cuid) || null;
		});
		vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid) => {
			return mockPolicies[cuid as keyof typeof mockPolicies] || null;
		});
		vi.mocked(leaveDao.getLeavePolicyEmploymentTypes).mockResolvedValue([
			{ leave_policy_cuid: 'p-cl', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-sl', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-el', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-ml', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-pl', employment_type_cuid: 'perm-type-cuid' }
		] as any);
		vi.mocked(leaveDao.getOverlappingRequests).mockResolvedValue([]);
		vi.mocked(leaveDao.getLeaveRequests).mockResolvedValue([]);
	});

	describe('resolveEmployee', () => {
		it('should resolve employee by official email', async () => {
			const result = await leaveService.resolveEmployee('john@pieq.ai');
			expect(result.employee).toEqual(mockEmployee);
			expect(result.employment).toEqual(mockEmployment);
		});

		it('should resolve employee by personal email', async () => {
			vi.mocked(db.employment.findFirst)
				.mockResolvedValueOnce(null) // first check by official email returns null
				.mockResolvedValueOnce(mockEmployment as any); // second check for personal email's employment returns match
			vi.mocked(db.employee.findFirst).mockResolvedValueOnce(mockEmployee as any);

			const result = await leaveService.resolveEmployee('john.personal@example.com');
			expect(result.employee).toEqual(mockEmployee);
			expect(result.employment).toEqual(mockEmployment);
		});

		it('should fall back to first employee in database if email not matched', async () => {
			vi.mocked(db.employment.findFirst).mockResolvedValue(null);
			vi.mocked(db.employee.findFirst).mockResolvedValueOnce(mockEmployee as any); // fallback
			vi.mocked(db.employment.findFirst).mockResolvedValueOnce(mockEmployment as any); // fallback employment

			const result = await leaveService.resolveEmployee('unmatched@example.com');
			expect(result.employee).toEqual(mockEmployee);
			expect(result.employment).toEqual(mockEmployment);
		});
	});

	describe('accrueLeaves', () => {
		it('should initialize missing balances for target year', async () => {
			// Mock no existing balances
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			// Call accrue for year 2026
			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Check createLeaveBalance was called
			expect(leaveDao.createLeaveBalance).toHaveBeenCalled();
		});

		it('should update CL/SL balances when monthly accrual increases', async () => {
			const mockBalance = {
				cuid: 'bal-cl',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				year: 2026,
				allocated_days: 1.0,
				remaining_days: 1.0,
				used_days: 0.0
			};
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid, typeCuid) => {
				if (typeCuid === 'cuid-cl') return mockBalance as any;
				return null;
			});

			// Joining date is Jan 2025. Today is June 2026 (local time mock).
			// target year 2026: 6 months accrued (Jan-June 2026) => 6 * 0.5 = 3.0 days
			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.updateLeaveBalance).toHaveBeenCalledWith('bal-cl', {
				allocated_days: 3.0,
				carried_forward_days: 0.0,
				remaining_days: 3.0,
				updated_by: 'system'
			});
		});
	});

	describe('applyLeave Validations', () => {
		beforeEach(() => {
			// Mock default balance return
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid, typeCuid) => {
				if (typeCuid === 'cuid-cl') {
					return { cuid: 'bal-cl', remaining_days: 5.0 } as any;
				}
				if (typeCuid === 'cuid-sl') {
					return { cuid: 'bal-sl', remaining_days: 3.0 } as any;
				}
				if (typeCuid === 'cuid-el') {
					return { cuid: 'bal-el', remaining_days: 10.0 } as any;
				}
				if (typeCuid === 'cuid-lwp') {
					return { cuid: 'bal-lwp', remaining_days: 365.0 } as any;
				}
				return null;
			});
		});

		it('should reject when leaveType is invalid', async () => {
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'invalid-cuid',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			})).rejects.toThrow(ValidationError);
		});

		it('should reject when end date is before start date', async () => {
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-17',
				endDate: '2026-06-16',
				isHalfDay: false
			})).rejects.toThrow('Start Date cannot exceed End Date');
		});

		it('should validate gender-specific policy mismatch', async () => {
			// Employee is Male. Maternity Leave requires Female.
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-ml',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			})).rejects.toThrow('This leave type is only applicable to Female employees');
		});

		it('should validate minimum service days mismatch', async () => {
			// EL policy requires 365 days of service.
			// Set joining date to 10 days before startDate.
			const recentEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2026-06-05T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(recentEmployment as any);

			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			})).rejects.toThrow('Minimum service of 365 days is required for this leave type');
		});

		it('should reject half-day request when session flag is missing', async () => {
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-15',
				isHalfDay: true
			})).rejects.toThrow('Half-day session (FN/AN) is required');
		});

		it('should reject half-day request when policy does not allow half-days', async () => {
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-15',
				endDate: '2026-06-15',
				isHalfDay: true,
				halfDaySession: 'FN'
			})).rejects.toThrow('Half-day leaves are not allowed for this leave type');
		});

		it('should reject request when supporting document is missing and required by policy threshold', async () => {
			// We modify policy to require document
			const modifiedPolicies = {
				...mockPolicies,
				'cuid-sl': {
					...mockPolicies['cuid-sl'],
					document_required: true,
					document_required_after_days: 3
				}
			};
			vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid) => {
				return modifiedPolicies[cuid as keyof typeof modifiedPolicies] || null;
			});

			// Request 3 days (June 15, 16, 17)
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-17',
				isHalfDay: false
			})).rejects.toThrow('A supporting document is required for leave requests of 3 days or more');
		});

		it('should reject request when overlapping request already exists', async () => {
			vi.mocked(leaveDao.getOverlappingRequests).mockResolvedValue([
				{ cuid: 'existing-req', start_date: new Date('2026-06-15'), end_date: new Date('2026-06-16'), is_half_day: false }
			] as any);

			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			})).rejects.toThrow('You have an overlapping leave request during this period');
		});

		it('should allow overlapping half-day requests on different sessions', async () => {
			// Existing request is AN half-day on June 15
			vi.mocked(leaveDao.getOverlappingRequests).mockResolvedValue([
				{ cuid: 'existing-req', start_date: new Date('2026-06-15T00:00:00Z'), end_date: new Date('2026-06-15T00:00:00Z'), is_half_day: true, half_day_session: 'AN' }
			] as any);

			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-req-cuid' } as any);

			// Requesting FN half-day on June 15
			const result = await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-15',
				isHalfDay: true,
				halfDaySession: 'FN'
			});

			expect(result).toBeDefined();
			expect(leaveDao.createLeaveRequest).toHaveBeenCalled();
		});

		it('should automatically split CL/SL request into LWP when primary balance is exceeded', async () => {
			// SL balance is 2 days, requesting 5 days (June 15 to June 19)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid, typeCuid) => {
				if (typeCuid === 'cuid-sl') {
					return { cuid: 'bal-sl', remaining_days: 2.0 } as any;
				}
				if (typeCuid === 'cuid-lwp') {
					return { cuid: 'bal-lwp', remaining_days: 10.0 } as any;
				}
				return null;
			});

			// Mock db.leaveType.findUnique for LWP lookup inside split logic
			vi.mocked(db.leaveType.findFirst).mockResolvedValue({ cuid: 'cuid-lwp', leave_code: 'LWP' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-19',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 2.0,
				days_from_lwp: 3.0
			}));
		});

		it('should reject split when LWP balance is also insufficient', async () => {
			// SL balance is 2 days, requesting 5 days (needs 3 LWP days)
			// LWP balance has only 1 day left.
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid, typeCuid) => {
				if (typeCuid === 'cuid-sl') {
					return { cuid: 'bal-sl', remaining_days: 2.0 } as any;
				}
				if (typeCuid === 'cuid-lwp') {
					return { cuid: 'bal-lwp', remaining_days: 1.0 } as any;
				}
				return null;
			});

			vi.mocked(db.leaveType.findFirst).mockResolvedValue({ cuid: 'cuid-lwp', leave_code: 'LWP' } as any);

			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-19',
				isHalfDay: false
			})).rejects.toThrow('Requested leave exceeds available balance. Split requires 3 LWP days, but you only have 1 LWP days left.');
		});

		it('should automatically split EL request into LWP when balance is exceeded', async () => {
			// EL balance is 5 days, requesting 7 days (June 15 to June 23, excluding weekends = 7 days)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid, typeCuid) => {
				if (typeCuid === 'cuid-el') {
					return { cuid: 'bal-el', remaining_days: 5.0 } as any;
				}
				if (typeCuid === 'cuid-lwp') {
					return { cuid: 'bal-lwp', remaining_days: 10.0 } as any;
				}
				return null;
			});

			vi.mocked(db.leaveType.findFirst).mockResolvedValue({ cuid: 'cuid-lwp', leave_code: 'LWP' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-15',
				endDate: '2026-06-23',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 5.0,
				days_from_lwp: 2.0
			}));
		});
	});

	describe('withdrawLeave', () => {
		it('should successfully withdraw pending request', async () => {
			const mockRequest = {
				cuid: 'req-123',
				employee_cuid: 'emp-cuid',
				request_status: 'pending'
			};
			vi.mocked(leaveDao.getLeaveRequestByCuid).mockResolvedValue(mockRequest as any);

			await leaveService.withdrawLeave('john@pieq.ai', 'req-123');

			expect(leaveDao.updateLeaveRequest).toHaveBeenCalledWith('req-123', expect.objectContaining({
				request_status: 'withdrawn'
			}));
		});

		it('should reject withdrawal of non-pending request', async () => {
			const mockRequest = {
				cuid: 'req-123',
				employee_cuid: 'emp-cuid',
				request_status: 'approved'
			};
			vi.mocked(leaveDao.getLeaveRequestByCuid).mockResolvedValue(mockRequest as any);

			await expect(leaveService.withdrawLeave('john@pieq.ai', 'req-123')).rejects.toThrow('Only pending leave requests can be withdrawn');
		});

		it('should reject withdrawal if request belongs to another employee', async () => {
			const mockRequest = {
				cuid: 'req-123',
				employee_cuid: 'other-emp-cuid',
				request_status: 'pending'
			};
			vi.mocked(leaveDao.getLeaveRequestByCuid).mockResolvedValue(mockRequest as any);

			await expect(leaveService.withdrawLeave('john@pieq.ai', 'req-123')).rejects.toThrow('Unauthorized: You can only withdraw your own leave requests');
		});
	});

	describe('approveLeaveRequest', () => {
		it('should update request status, deduct balances, and create attendance records', async () => {
			const mockRequest = {
				cuid: 'req-123',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-16T00:00:00Z'),
				total_days: 2.0,
				is_half_day: false,
				request_status: 'pending',
				days_from_primary: 2.0,
				days_from_lwp: 0.0
			};

			const mockClBalance = {
				cuid: 'bal-cl',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				year: 2026,
				used_days: 0.0,
				remaining_days: 5.0
			};

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', leave_name: 'Casual Leave', leave_code: 'CL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockClBalance);

			await leaveService.approveLeaveRequest('req-123', 'admin-cuid');

			// Check request status updated
			expect(db.leaveRequest.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { cuid: 'req-123' },
				data: expect.objectContaining({
					request_status: 'approved',
					approved_by: 'admin-cuid'
				})
			}));

			// Check balance decremented
			expect(db.leaveBalance.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { cuid: 'bal-cl' },
				data: {
					used_days: { increment: 2.0 },
					remaining_days: { decrement: 2.0 }
				}
			}));

			// Check attendance records created (2 days: 15th and 16th)
			expect(db.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
			expect(db.attendanceRecord.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
				create: expect.objectContaining({
					attendance_status: 'Absent'
				})
			}));
		});
	});

	describe('approveLeaveRequest and rejectLeaveRequest Screen 2 tests', () => {
		it('should reject a pending leave request', async () => {
			const mockRequest = {
				cuid: 'req-reject-123',
				employee_cuid: 'emp-cuid',
				request_status: 'pending'
			};
			vi.mocked(leaveDao.getLeaveRequestByCuid).mockResolvedValue(mockRequest as any);

			await leaveService.rejectLeaveRequest('req-reject-123', 'mgr-code');

			expect(leaveDao.updateLeaveRequest).toHaveBeenCalledWith('req-reject-123', expect.objectContaining({
				request_status: 'rejected',
				rejected_by: 'mgr-code'
			}));
		});

		it('should prevent duplicate approvals or approvals of non-pending requests', async () => {
			const mockRequest = {
				cuid: 'req-approved',
				employee_cuid: 'emp-cuid',
				request_status: 'approved'
			};
			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);

			await expect(leaveService.approveLeaveRequest('req-approved', 'mgr-code')).rejects.toThrow('Leave request is not in pending status.');
		});

		it('should prevent approval if balance is insufficient', async () => {
			const mockRequest = {
				cuid: 'req-insufficient',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-el',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-16T00:00:00Z'),
				total_days: 2.0,
				is_half_day: false,
				request_status: 'pending',
				days_from_primary: 2.0,
				days_from_lwp: 0.0
			};
			const mockElBalance = {
				cuid: 'bal-el',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-el',
				year: 2026,
				remaining_days: 1.0
			};

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-el', leave_name: 'Earned Leave', leave_code: 'EL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockElBalance);

			await expect(leaveService.approveLeaveRequest('req-insufficient', 'mgr-code')).rejects.toThrow('Insufficient leave balance.');
		});

		it('should prevent approval if attendance record exists with WFH/Present/Holiday status', async () => {
			const mockRequest = {
				cuid: 'req-wfh-conflict',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-15T00:00:00Z'),
				total_days: 1.0,
				is_half_day: false,
				request_status: 'pending',
				days_from_primary: 1.0,
				days_from_lwp: 0.0
			};
			const mockClBalance = {
				cuid: 'bal-cl',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				year: 2026,
				remaining_days: 5.0
			};

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', leave_name: 'Casual Leave', leave_code: 'CL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockClBalance);

			vi.mocked(db.attendanceRecord.findUnique as any).mockResolvedValue({
				cuid: 'att-123',
				attendance_status: 'WFH'
			});

			await expect(leaveService.approveLeaveRequest('req-wfh-conflict', 'mgr-code')).rejects.toThrow("already exists with status 'WFH'");
		});

		it('should upsert attendance record as Absent for full-day leave and HalfDay for half-day leave', async () => {
			const mockRequest = {
				cuid: 'req-half-day',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-15T00:00:00Z'),
				total_days: 0.5,
				is_half_day: true,
				half_day_session: 'FN',
				request_status: 'pending',
				days_from_primary: 0.5,
				days_from_lwp: 0.0
			};
			const mockClBalance = {
				cuid: 'bal-cl',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				year: 2026,
				remaining_days: 5.0
			};

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', leave_name: 'Casual Leave', leave_code: 'CL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockClBalance);
			vi.mocked(db.attendanceRecord.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-half-day', 'mgr-code');

			expect(db.attendanceRecord.upsert).toHaveBeenCalledWith(expect.objectContaining({
				create: expect.objectContaining({
					attendance_status: 'HalfDay'
				})
			}));
		});
	});
});
