import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as leaveDao from '$lib/server/dao/leave.dao.js';
import { db } from '$lib/server/db.js';
import { ValidationError } from '$lib/server/utils/errors.js';

vi.mock('$lib/server/db.js', () => {
	const mockDb = {
		employee: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn()
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
			update: vi.fn(),
			create: vi.fn()
		},
		leaveRequest: {
			findUnique: vi.fn(),
			update: vi.fn(),
			findMany: vi.fn()
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
		upsertAttendanceRecord: vi.fn(),
		getSubordinates: vi.fn()
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
		{ cuid: 'cuid-lwp', leave_code: 'LWP', leave_name: 'Leave Without Pay', is_paid: false, requires_approval: true },
		{ cuid: 'cuid-lop', leave_code: 'LOP', leave_name: 'Loss of Pay', is_paid: false, requires_approval: true }
	];

	const mockPolicies = {
		'cuid-cl': { cuid: 'p-cl', leave_type_cuid: 'cuid-cl', annual_limit: 6, max_per_month: 2, carry_forward_allowed: false, min_service_days: 0, allow_half_day: true, gender_specific: false, status: true },
		'cuid-sl': { cuid: 'p-sl', leave_type_cuid: 'cuid-sl', annual_limit: 6, max_per_month: 2, carry_forward_allowed: false, min_service_days: 0, allow_half_day: true, gender_specific: false, status: true },
		'cuid-el': { cuid: 'p-el', leave_type_cuid: 'cuid-el', annual_limit: 12, max_per_month: 1, carry_forward_allowed: true, min_service_days: 365, allow_half_day: false, gender_specific: false, status: true },
		'cuid-ml': { cuid: 'p-ml', leave_type_cuid: 'cuid-ml', annual_limit: 180, max_per_month: null, carry_forward_allowed: false, min_service_days: 80, allow_half_day: false, gender_specific: true, applicable_gender: 'Female', status: true },
		'cuid-pl': { cuid: 'p-pl', leave_type_cuid: 'cuid-pl', annual_limit: 5, max_per_month: null, carry_forward_allowed: false, min_service_days: 0, allow_half_day: false, gender_specific: true, applicable_gender: 'Male', status: true },
		'cuid-lwp': { cuid: 'p-lwp', leave_type_cuid: 'cuid-lwp', annual_limit: 365, max_per_month: null, carry_forward_allowed: false, min_service_days: 0, allow_half_day: true, gender_specific: false, status: true },
		'cuid-lop': { cuid: 'p-lop', leave_type_cuid: 'cuid-lop', annual_limit: 365, max_per_month: null, carry_forward_allowed: false, min_service_days: 0, allow_half_day: false, gender_specific: false, status: true }
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Default DB mocks
		vi.mocked(db.employment.findFirst).mockResolvedValue(mockEmployment as any);
		vi.mocked(db.employee.findUnique).mockResolvedValue(mockEmployee as any);
		vi.mocked(db.employee.findFirst).mockResolvedValue(mockEmployee as any);
		vi.mocked(db.$transaction).mockImplementation(async (cb: (tx: typeof db) => Promise<unknown>) => cb(db));

		// Default DAO mocks
		vi.mocked(leaveDao.listLeaveTypes).mockResolvedValue(mockLeaveTypes as any);
		vi.mocked(leaveDao.listLeavePolicies).mockResolvedValue(Object.values(mockPolicies) as any);
		vi.mocked(leaveDao.getLeaveTypeByCuid).mockImplementation(async (cuid: string) => {
			return mockLeaveTypes.find(t => t.cuid === cuid) || null;
		});
		vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: string) => {
			return mockPolicies[cuid as keyof typeof mockPolicies] || null;
		});
		vi.mocked(leaveDao.getLeavePolicyEmploymentTypes).mockResolvedValue([
			{ leave_policy_cuid: 'p-cl', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-sl', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-el', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-ml', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-pl', employment_type_cuid: 'perm-type-cuid' },
			{ leave_policy_cuid: 'p-lop', employment_type_cuid: 'perm-type-cuid' }
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
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string) => {
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
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string) => {
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
			vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: string) => {
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

		it('should reject Casual Leave (CL) request exceeding 2 days with a clear validation message', async () => {
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-18', // 4 days request
				isHalfDay: false
			})).rejects.toThrow('Maximum 2 days can be applied in a single Casual Leave request. For longer leaves, please apply using Sick Leave (SL) or Earned Leave (EL) instead.');
		});

		it('should automatically split SL request into LOP when primary balance is exceeded (via applyLeave)', async () => {
			// SL balance is 2 days, requesting 5 days (June 15 to June 19)
			// The excess 3 days should automatically become LOP (not LWP)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string) => {
				if (typeCuid === 'cuid-sl') {
					return { cuid: 'bal-sl', remaining_days: 2.0 } as any;
				}
				return null;
			});

			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-req-cuid' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-19',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 2.0,
				days_from_lop: 3.0
			}));
		});

		it('should automatically split EL request into LWP when balance is exceeded', async () => {
			// EL balance is 5 days, requesting 7 days (June 15 to June 23, excluding weekends = 7 days)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string) => {
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

	describe('Earned Leave (EL) Specific Logic', () => {
		it('should reject a single EL request exceeding 24 days', async () => {
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue({ cuid: 'bal-el', remaining_days: 30.0 } as any);

			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-01',
				endDate: '2026-07-05', // More than 24 days (excluding weekends, but still > 24 working days)
				isHalfDay: false
			})).rejects.toThrow('A single Earned Leave (EL) request must not exceed 24 days.');
		});

		it('should not grant any EL credit for the year if employee has resigned/relieved in that year', async () => {
			const resignedEmployment = {
				...mockEmployment,
				employment_status: 'active',
				relieving_date: new Date('2026-08-15T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(resignedEmployment as any);
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null); // Force creation

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Check that EL balance was initialized with 0 allocated days
			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
				leave_type_cuid: 'cuid-el',
				allocated_days: 0.0
			}));
		});

		it('should not grant any EL credit for the year if employee status is resigned', async () => {
			const resignedEmployment = {
				...mockEmployment,
				employment_status: 'resigned',
				relieving_date: null
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(resignedEmployment as any);
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null); // Force creation

			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
				leave_type_cuid: 'cuid-el',
				allocated_days: 0.0
			}));
		});

		it('should limit EL calculations to the eligible service period (after min_service_days)', async () => {
			// Join Date is 2025-06-01. Target year is 2026. min_service_days is 365.
			// Eligible period starts 2026-06-01.
			// Eligible period for 2026 is 2026-06-01 to 2026-12-31 (7 months).
			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2025-06-01T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Expected allocated days: 7.0 days (7 months of eligible service)
			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
				leave_type_cuid: 'cuid-el',
				allocated_days: expect.closeTo(7.0, 1)
			}));
		});

		it('should calculate carry-forward correctly prioritizing allocated days usage first', async () => {
			// Previous year (2025) balance:
			// allocated_days = 12.0
			// carried_forward_days = 10.0
			// used_days = 14.0
			//
			// unusedAllocated = max(0, 12 - 14) = 0
			// cfFromAllocated = min(6.0, 0) = 0
			// unusedPreviousCarriedForward = max(0, 10 - max(0, 14 - 12)) = 10 - 2 = 8
			// Expected carry-forward = 8.0
			const prevBalance = {
				cuid: 'prev-bal-el',
				allocated_days: 12.0,
				carried_forward_days: 10.0,
				used_days: 14.0,
				remaining_days: 8.0
			};

			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string, year?: number) => {
				if (typeCuid === 'cuid-el' && year === 2025) return prevBalance as any;
				return null;
			});

			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2024-01-01T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
				leave_type_cuid: 'cuid-el',
				carried_forward_days: 8.0
			}));
		});

		it('should retain previous carry-forward as-is when used_days <= allocated_days', async () => {
			// Previous year (2025) balance:
			// allocated_days = 12.0
			// carried_forward_days = 10.0
			// used_days = 4.0
			//
			// unusedAllocated = max(0, 12 - 4) = 8
			// cfFromAllocated = min(6.0, 8) = 6
			// unusedPreviousCarriedForward = max(0, 10 - max(0, 4 - 12)) = 10
			// Expected carry-forward = 6 + 10 = 16.0
			const prevBalance = {
				cuid: 'prev-bal-el',
				allocated_days: 12.0,
				carried_forward_days: 10.0,
				used_days: 4.0,
				remaining_days: 18.0
			};

			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string, year?: number) => {
				if (typeCuid === 'cuid-el' && year === 2025) return prevBalance as any;
				return null;
			});

			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2024-01-01T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
				leave_type_cuid: 'cuid-el',
				carried_forward_days: 16.0
			}));
		});

		it('should cap the total EL remaining days at 24', async () => {
			// allocated_days = 12.0
			// carried_forward_days = 16.0
			// total = 28.0. Remaining capped at 24.
			const prevBalance = {
				cuid: 'prev-bal-el',
				allocated_days: 12.0,
				carried_forward_days: 10.0,
				used_days: 4.0 // unusedAllocated = 8 -> cfFromAllocated = 6. unusedPreviousCarriedForward = 10. carried_forward_days = 16
			};

			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string, year?: number) => {
				if (typeCuid === 'cuid-el' && year === 2025) return prevBalance as any;
				return null;
			});

			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2024-01-01T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
				leave_type_cuid: 'cuid-el',
				remaining_days: 24.0
			}));
		});

		it('should recalculate remaining days correctly after leaves are used (capped starting balance - used)', async () => {
			// Current balance in DB:
			// allocated_days = 12.0
			// carried_forward_days = 16.0
			// used_days = 2.0
			//
			// remaining = min(24.0, 12.0 + 16.0) - 2.0 = 22.0
			const currentBalance = {
				cuid: 'bal-el-cuid',
				allocated_days: 12.0,
				carried_forward_days: 16.0,
				used_days: 2.0,
				remaining_days: 22.0
			};

			const prevBalance = {
				cuid: 'prev-bal-el',
				allocated_days: 12.0,
				carried_forward_days: 10.0,
				used_days: 4.0, // unusedAllocated = 8 -> cfFromAllocated = 6. unusedPreviousCarriedForward = 10. carried_forward_days = 16
				remaining_days: 18.0
			};

			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string, year?: number) => {
				if (typeCuid === 'cuid-el') {
					if (year === 2026) return currentBalance as any;
					if (year === 2025) return prevBalance as any;
				}
				return null;
			});

			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2024-01-01T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.updateLeaveBalance).toHaveBeenCalledWith('bal-el-cuid', expect.objectContaining({
				remaining_days: 22.0
			}));
		});
	});

	describe('Loss of Pay (LOP) Specific Logic', () => {
		it('should automatically split CL request into LOP when primary balance is exceeded', async () => {
			// CL balance is 1 day, requesting 2 days (June 15 to June 16)
			// CL allows max 2 days per request; requesting exactly 2 with only 1 available triggers LOP split.
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string) => {
				if (typeCuid === 'cuid-cl') {
					return { cuid: 'bal-cl', remaining_days: 1.0 } as any;
				}
				return null;
			});

			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-req-cuid' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 1.0,
				days_from_lop: 1.0
			}));
		});

		it('should automatically split SL request into LOP when primary balance is exceeded', async () => {
			// SL balance is 1 day, requesting 3 days (June 15 to June 17)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid, typeCuid) => {
				if (typeCuid === 'cuid-sl') {
					return { cuid: 'bal-sl', remaining_days: 1.0 } as any;
				}
				return null;
			});

			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-req-cuid' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-17',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 1.0,
				days_from_lop: 2.0
			}));
		});

		it('should create a new LOP balance and increment used_days when LOP request is approved and balance does not exist', async () => {
			const mockRequest = {
				cuid: 'req-lop-123',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-16T00:00:00Z'),
				total_days: 2.0,
				is_half_day: false,
				request_status: 'pending',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			};

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', leave_name: 'Casual Leave', leave_code: 'CL' });
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lop', leave_name: 'Loss of Pay', leave_code: 'LOP' });
			
			// Mock finding LOP balance returns null (does not exist yet)
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-lop-123', 'admin-cuid');

			// Check that leaveBalance.create was called for LOP
			expect(db.leaveBalance.create).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					leave_type_cuid: 'cuid-lop',
					used_days: 2.0,
					allocated_days: 0.0,
					remaining_days: 0.0
				})
			}));
		});

		it('should update existing LOP balance used_days when LOP request is approved and balance already exists', async () => {
			const mockRequest = {
				cuid: 'req-lop-124',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-16T00:00:00Z'),
				total_days: 2.0,
				is_half_day: false,
				request_status: 'pending',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			};

			const mockLopBalance = {
				cuid: 'bal-lop-cuid',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-lop',
				year: 2026,
				used_days: 1.0,
				remaining_days: 0.0
			};

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', leave_name: 'Casual Leave', leave_code: 'CL' });
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lop', leave_name: 'Loss of Pay', leave_code: 'LOP' });
			
			// Mock finding LOP balance returns existing balance
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockLopBalance);

			await leaveService.approveLeaveRequest('req-lop-124', 'admin-cuid');

			// Check that leaveBalance.update was called for LOP
			expect(db.leaveBalance.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { cuid: 'bal-lop-cuid' },
				data: {
					used_days: { increment: 2.0 }
				}
			}));
		});

		it('should return the updated LOP balance via getEmployeeLeaveDetails after approval', async () => {
			const mockLopBalance = {
				cuid: 'bal-lop-cuid',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-lop',
				year: 2026,
				allocated_days: 0.0,
				used_days: 2.0,
				remaining_days: 0.0,
				carried_forward_days: 0.0
			};

			vi.mocked(leaveDao.getLeaveBalances).mockResolvedValue([mockLopBalance] as any);
			vi.mocked(leaveDao.getLeaveRequests).mockResolvedValue([]);
			vi.mocked(leaveDao.getSubordinates).mockResolvedValue([]);

			const result = await leaveService.getEmployeeLeaveDetails('john@pieq.ai', 2026);

			const lopBal = result.balances.find(b => b.leave_code === 'LOP');
			expect(lopBal).toBeDefined();
			expect(lopBal?.used_days).toBe(2.0);
			expect(lopBal?.remaining_days).toBe(0.0);
		});

		it('should return the updated LWP balance via getEmployeeLeaveDetails after approval', async () => {
			const mockLwpBalance = {
				cuid: 'bal-lwp-cuid',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-lwp',
				year: 2026,
				allocated_days: 365.0,
				used_days: 3.0,
				remaining_days: 362.0,
				carried_forward_days: 0.0
			};

			vi.mocked(leaveDao.getLeaveBalances).mockResolvedValue([mockLwpBalance] as any);
			vi.mocked(leaveDao.getLeaveRequests).mockResolvedValue([]);
			vi.mocked(leaveDao.getSubordinates).mockResolvedValue([]);

			const result = await leaveService.getEmployeeLeaveDetails('john@pieq.ai', 2026);

			const lwpBal = result.balances.find(b => b.leave_code === 'LWP');
			expect(lwpBal).toBeDefined();
			expect(lwpBal?.used_days).toBe(3.0);
			expect(lwpBal?.remaining_days).toBe(362.0);
		});

		it('should preserve and return days_from_lop values in getPendingApprovalsForManager', async () => {
			const mockSubordinate = {
				employee_cuid: 'sub-cuid',
				employee_code: 'SUB001',
				first_name: 'Subordinate',
				last_name: 'User'
			};

			const mockPendingRequest = {
				cuid: 'req-pending-lop',
				employee_cuid: 'sub-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-17T00:00:00Z'),
				total_days: 3.0,
				is_half_day: false,
				half_day_session: null,
				reason: 'Medical rest',
				document_url: null,
				request_status: 'pending',
				days_from_primary: 1.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0,
				created_at: new Date('2026-06-14T10:00:00Z')
			};

			vi.mocked(leaveDao.getSubordinates).mockResolvedValue([mockSubordinate] as any);
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([mockPendingRequest]);
			vi.mocked(db.employee.findMany as any).mockResolvedValue([
				{ cuid: 'sub-cuid', emp_code: 'SUB001', first_name: 'Subordinate', last_name: 'User' }
			]);

			const result = await leaveService.getPendingApprovalsForManager('manager-cuid');

			expect(result.length).toBe(1);
			expect(result[0].days_from_lop).toBe(2.0);
			expect(result[0].days_from_primary).toBe(1.0);
		});

		it('should ensure dashboard statistics receive the correct LOP used_days value after approval', async () => {
			// Simulates dashboard data load for employee details
			const mockLopBalance = {
				cuid: 'bal-lop-cuid',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-lop',
				year: 2026,
				allocated_days: 0.0,
				used_days: 5.0, // After LOP request approved
				remaining_days: 0.0,
				carried_forward_days: 0.0
			};

			vi.mocked(leaveDao.getLeaveBalances).mockResolvedValue([mockLopBalance] as any);
			vi.mocked(leaveDao.getLeaveRequests).mockResolvedValue([]);
			vi.mocked(leaveDao.getSubordinates).mockResolvedValue([]);

			const dashboardDetails = await leaveService.getEmployeeLeaveDetails('john@pieq.ai', 2026);

			// This replicates the frontend dashboard statistics finding LOP used_days:
			const lopStat = dashboardDetails.balances.find(b => b.leave_code === 'LOP');
			expect(lopStat).toBeDefined();
			expect(lopStat?.used_days).toBe(5.0);
			expect(lopStat?.allocated_days).toBe(0.0);
			expect(lopStat?.remaining_days).toBe(0.0);
		});
	});
});
