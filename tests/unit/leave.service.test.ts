import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as leaveService from '../../src/lib/server/services/leave.service.js';
import * as leaveDao from '../../src/lib/server/dao/leave.dao.js';
import { db } from '../../src/lib/server/db.js';
import { ValidationError } from '../../src/lib/server/utils/errors.js';

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
			findMany: vi.fn(),
			create: vi.fn()
		},
		attendanceRecord: {
			findUnique: vi.fn(),
			upsert: vi.fn()
		},
		holidayCalendar: {
			findMany: vi.fn().mockResolvedValue([]),
			findFirst: vi.fn()
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
		getSubordinates: vi.fn(),
		getEmploymentByEmployeeCuid: vi.fn(),
		getActiveEmploymentByEmployeeCuid: vi.fn(),
		getApprovedRequestsInPeriod: vi.fn(),
		getApprovedRequestsBeforeDate: vi.fn(),
		getApprovedRequestsInMonthRange: vi.fn(),
		getApprovedRequestsOverlapping: vi.fn(),
		getLeaveTypeByCode: vi.fn(),
		getAttendanceRecord: vi.fn(),
		getLeaveRequestsForEmployees: vi.fn(),
		runTransaction: vi.fn((action: any) => action(db))
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
		{ cuid: 'cuid-cl', code: 'CL', name: 'Casual Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-sl', code: 'SL', name: 'Sick Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-el', code: 'EL', name: 'Earned Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-ml', code: 'ML', name: 'Maternity Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-pl', code: 'PL', name: 'Paternity Leave', is_paid: true, requires_approval: true },
		{ cuid: 'cuid-lwp', code: 'LWP', name: 'Leave Without Pay', is_paid: false, requires_approval: true },
		{ cuid: 'cuid-lop', code: 'LOP', name: 'Loss of Pay', is_paid: false, requires_approval: true }
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
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
		vi.clearAllMocks();

		// Default DB mocks
		vi.mocked(db.employment.findFirst).mockResolvedValue(mockEmployment as any);
		vi.mocked(db.employee.findUnique).mockResolvedValue(mockEmployee as any);
		vi.mocked(db.employee.findFirst).mockResolvedValue(mockEmployee as any);
		vi.mocked(db.employee.findMany).mockResolvedValue([]);
		vi.mocked(db.$transaction).mockImplementation(async (cb: (tx: typeof db) => Promise<unknown>) => cb(db));
		vi.mocked(db.leaveRequest.findMany).mockResolvedValue([]);
		vi.mocked(db.leaveRequest.findUnique).mockResolvedValue(null);
		vi.mocked(db.leaveRequest.update).mockResolvedValue({} as any);
		vi.mocked(db.leaveType.findUnique).mockImplementation((async (args: any) => {
			const cuid = args?.where?.cuid;
			return mockLeaveTypes.find(t => t.cuid === cuid) || null;
		}) as any);
		vi.mocked(db.leaveType.findFirst).mockImplementation((async (args: any) => {
			const code = args?.where?.code;
			return mockLeaveTypes.find(t => t.code === code) || null;
		}) as any);
		vi.mocked(db.leavePolicy.findFirst).mockResolvedValue(null);
		vi.mocked(db.leaveBalance.findUnique).mockResolvedValue(null);
		vi.mocked(db.leaveBalance.update).mockResolvedValue({} as any);
		vi.mocked(db.leaveBalance.create).mockResolvedValue({} as any);
		vi.mocked(db.attendanceRecord.findUnique).mockResolvedValue(null);
		vi.mocked(db.attendanceRecord.upsert).mockResolvedValue({} as any);

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
		vi.mocked(leaveDao.getLeaveRequests).mockImplementation(async (employeeCuid: string, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.findMany({
				where: { employee_cuid: employeeCuid },
				orderBy: { created_at: 'desc' }
			});
		});
		vi.mocked(leaveDao.getLeaveBalances).mockImplementation(async (employeeCuid: string, year: number, tx?: any) => {
			const client = tx || db;
			return client.leaveBalance.findMany({
				where: { employee_cuid: employeeCuid, year },
				orderBy: { id: 'asc' }
			});
		});
		vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (employeeCuid: string, leaveTypeCuid: string, year: number, tx?: any) => {
			const client = tx || db;
			return client.leaveBalance.findUnique({
				where: {
					employee_cuid_leave_type_cuid_year: {
						employee_cuid: employeeCuid,
						leave_type_cuid: leaveTypeCuid,
						year
					}
				}
			});
		});
		vi.mocked(leaveDao.createLeaveBalance).mockImplementation(async (data: any, tx?: any) => {
			const client = tx || db;
			return client.leaveBalance.create({ data });
		});
		vi.mocked(leaveDao.updateLeaveBalance).mockImplementation(async (cuid: string, data: any, tx?: any) => {
			const client = tx || db;
			return client.leaveBalance.update({ where: { cuid }, data });
		});
		vi.mocked(leaveDao.getLeaveRequestByCuid).mockImplementation(async (cuid: string, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.findUnique({ where: { cuid } });
		});
		vi.mocked(leaveDao.createLeaveRequest).mockImplementation(async (data: any, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.create({ data });
		});
		vi.mocked(leaveDao.updateLeaveRequest).mockImplementation(async (cuid: string, data: any, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.update({ where: { cuid }, data });
		});
		vi.mocked(leaveDao.upsertAttendanceRecord).mockImplementation(async (data: any, tx?: any) => {
			const client = tx || db;
			return client.attendanceRecord.upsert({
				where: {
					employee_cuid_attendance_date: {
						employee_cuid: data.employee_cuid,
						attendance_date: data.attendance_date
					}
				},
				create: data,
				update: data
			});
		});
		vi.mocked(leaveDao.getSubordinates).mockImplementation(async (managerEmployeeCuid: string, tx?: any) => {
			const client = tx || db;
			return client.employment.findMany({
				where: { reporting_manager_cuid: managerEmployeeCuid },
				select: { employee_cuid: true }
			});
		});
		vi.mocked(leaveDao.getEmploymentByEmployeeCuid).mockImplementation(async (cuid: string, tx?: any) => {
			const client = tx || db;
			const res = await client.employment.findFirst({ where: { employee_cuid: cuid } });
			return res ? { ...res, reporting_manager_cuid: res.reporting_manager_cuid ?? 'emp-cuid' } : null;
		});
		vi.mocked(leaveDao.getActiveEmploymentByEmployeeCuid).mockImplementation(async (cuid: string, tx?: any) => {
			const client = tx || db;
			return client.employment.findFirst({ where: { employee_cuid: cuid, employment_status: 'active' } });
		});
		vi.mocked(leaveDao.getLeaveTypeByCode).mockImplementation(async (code: string, tx?: any) => {
			const client = tx || db;
			return client.leaveType.findFirst({ where: { code } });
		});
		vi.mocked(leaveDao.getAttendanceRecord).mockImplementation(async (employeeCuid: string, attendanceDate: Date, tx?: any) => {
			const client = tx || db;
			return client.attendanceRecord.findUnique({
				where: {
					employee_cuid_attendance_date: {
						employee_cuid: employeeCuid,
						attendance_date: attendanceDate
					}
				}
			});
		});
		vi.mocked(leaveDao.getApprovedRequestsInMonthRange).mockImplementation(async (employeeCuid: string, leaveTypeCuid: string, start: Date, end: Date, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.findMany({
				where: {
					employee_cuid: employeeCuid,
					leave_type_cuid: leaveTypeCuid,
					request_status: 'approved',
					start_date: { gte: start, lte: end }
				}
			});
		});
		vi.mocked(leaveDao.getApprovedRequestsInPeriod).mockImplementation(async (employeeCuid: string, cycleStart: Date, cycleEnd: Date, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.findMany({
				where: {
					employee_cuid: employeeCuid,
					request_status: 'approved',
					start_date: { lte: cycleEnd },
					end_date: { gte: cycleStart }
				}
			});
		});
		vi.mocked(leaveDao.getApprovedRequestsBeforeDate).mockImplementation(async (employeeCuid: string, leaveTypeCuid: string, endOfYear: Date, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.findMany({
				where: {
					employee_cuid: employeeCuid,
					leave_type_cuid: leaveTypeCuid,
					request_status: 'approved',
					start_date: { lte: endOfYear }
				}
			});
		});
		vi.mocked(leaveDao.getApprovedRequestsOverlapping).mockImplementation(async (start: Date, end: Date, tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.findMany({
				where: {
					request_status: 'approved',
					start_date: { lte: end },
					end_date: { gte: start }
				}
			});
		});
		vi.mocked(leaveDao.getLeaveRequestsForEmployees).mockImplementation(async (employeeCuids: string[], tx?: any) => {
			const client = tx || db;
			return client.leaveRequest.findMany({
				where: { employee_cuid: { in: employeeCuids } },
				orderBy: { created_at: 'desc' }
			});
		});
	});

	afterEach(() => {
		vi.useRealTimers();
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
			vi.setSystemTime(new Date('2026-06-15T10:00:00.000Z'));
			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.updateLeaveBalance).toHaveBeenCalledWith('bal-cl', {
				allocated_days: 3.0,
				carried_forward_days: 0.0,
				remaining_days: 3.0,
				updated_by: 'system'
			});
		});

		it('should correctly calculate EL carry-forward balances according to the capping rules', async () => {
			const scenarios = [
				{ prevCarried: 20, unusedEl: 6, expectedCf: 24, maxCf: 24 },
				{ prevCarried: 10, unusedEl: 4, expectedCf: 14, maxCf: 24 },
				{ prevCarried: 24, unusedEl: 6, expectedCf: 24, maxCf: 24 },
				{ prevCarried: 0, unusedEl: 6, expectedCf: 6, maxCf: 24 },
				{ prevCarried: 0, unusedEl: 12, expectedCf: 6, maxCf: 24 },
				{ prevCarried: 6, unusedEl: 12, expectedCf: 12, maxCf: 24 },
				{ prevCarried: 18, unusedEl: 12, expectedCf: 24, maxCf: 24 },
				{ prevCarried: 20, unusedEl: 12, expectedCf: 24, maxCf: 24 },
				{ prevCarried: 24, unusedEl: 12, expectedCf: 24, maxCf: 24 },
				// Test database-driven dynamic limit changes (e.g. maxCf = 18 and maxCf = 30)
				{ prevCarried: 20, unusedEl: 6, expectedCf: 18, maxCf: 18 },
				{ prevCarried: 20, unusedEl: 12, expectedCf: 26, maxCf: 30 }
			];

			for (const sc of scenarios) {
				vi.clearAllMocks();

				// Mock policy with the scenario's maxCf limit
				const modifiedPolicies = {
					...mockPolicies,
					'cuid-el': {
						...mockPolicies['cuid-el'],
						max_carry_forward_days: sc.maxCf
					}
				};
				vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: string) => {
					return modifiedPolicies[cuid as keyof typeof modifiedPolicies] || null;
				});

				// Previous year EL balance (year 2025)
				// unusedEl is the unused portion of Allocated Days.
				// Allocated is 12, so usage must be (12 - unusedEl).
				const prevUsed = 12.0 - sc.unusedEl;
				const mockPrevBalance = {
					cuid: 'bal-el-2025',
					employee_cuid: 'emp-cuid',
					leave_type_cuid: 'cuid-el',
					year: 2025,
					allocated_days: 12.0,
					carried_forward_days: sc.prevCarried,
					used_days: prevUsed,
					remaining_days: 12.0 + sc.prevCarried - prevUsed
				};

				vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string, year: number) => {
					if (typeCuid === 'cuid-el') {
						if (year === 2025) return mockPrevBalance as any;
						if (year === 2026) return null; // assume no existing balance for 2026 yet
					}
					return null;
				});

				// Execute accrue for 2026 (joining date is 2025, so year 2026 > joinYear)
				await leaveService.accrueLeaves('emp-cuid', 2026);

				// Verify created balance has the capped carried forward days
				expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
					leave_type_cuid: 'cuid-el',
					year: 2026,
					carried_forward_days: sc.expectedCf
				}));
			}
		});

		it('should dynamically accrue CL/SL based on Leave Policy annual limit', async () => {
			vi.clearAllMocks();
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			// Mock custom policy with annual_limit = 18 for CL (which means monthly credit = 18/12 = 1.5)
			const customPolicies = {
				...mockPolicies,
				'cuid-cl': {
					...mockPolicies['cuid-cl'],
					annual_limit: 18.0
				}
			};
			vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: string) => {
				return customPolicies[cuid as keyof typeof customPolicies] || null;
			});

			// Join date is Jan 1st 2025. System time is June 15th 2026.
			// monthsAccrued = 6.0 (Jan-June).
			// monthly credit = 18 / 12 = 1.5.
			// expected accrued CL = min(18, 6.0 * 1.5) = 9.0.
			vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-cl',
					allocated_days: 9.0
				})
			);
		});

		it('should grant full monthly credit for the joining month regardless of join day', async () => {
			vi.clearAllMocks();
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			// Set employee joining date to June 28th, 2026.
			// System time is June 28th, 2026.
			// Employee joined within June, so June must count as a full month (1.0 months).
			// CL monthly credit = 6 / 12 = 0.5.
			// Expected CL accrued = 1.0 * 0.5 = 0.5.
			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2026-06-28T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
			await leaveService.accrueLeaves('emp-cuid', 2026);

			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-cl',
					allocated_days: 0.5
				})
			);
		});

		it('should automatically credit Maternity Leave (ML) to Female employees only when meeting min_service_days', async () => {
			vi.clearAllMocks();
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			// Female employee
			const femaleEmployee = { ...mockEmployee, gender: 'Female' };
			vi.mocked(db.employee.findUnique).mockResolvedValue(femaleEmployee as any);
			vi.mocked(db.employee.findFirst).mockResolvedValue(femaleEmployee as any);

			// Scenario 1: Meets min_service_days (80 days). Join date 90 days ago.
			// mockPolicies has cuid-ml annual_limit: 180, min_service_days: 80
			const testEmploymentMeets = {
				...mockEmployment,
				date_of_joining: new Date('2026-03-01T00:00:00.000Z') // March 1st 2026
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmploymentMeets as any);

			// System time is June 15th 2026 -> 106 days since joining.
			vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Should create ML balance with annual_limit (180)
			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-ml',
					allocated_days: 180.0,
					remaining_days: 180.0
				})
			);

			// Scenario 2: Does not meet min_service_days. Join date 10 days ago.
			vi.clearAllMocks();
			const testEmploymentFails = {
				...mockEmployment,
				date_of_joining: new Date('2026-06-05T00:00:00.000Z') // June 5th 2026 (10 days service)
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmploymentFails as any);
			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Should NOT create ML balance row
			expect(leaveDao.createLeaveBalance).not.toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-ml'
				})
			);
		});

		it('should automatically credit Paternity Leave (PL) to Male employees meeting min_service_days', async () => {
			vi.clearAllMocks();
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			// Male employee
			const maleEmployee = { ...mockEmployee, gender: 'Male' };
			vi.mocked(db.employee.findUnique).mockResolvedValue(maleEmployee as any);
			vi.mocked(db.employee.findFirst).mockResolvedValue(maleEmployee as any);

			// Scenario 1: Meets min_service_days (0 days). Join date 1 day ago.
			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2026-06-14T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Should create PL balance with annual_limit (5)
			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-pl',
					allocated_days: 5.0,
					remaining_days: 5.0
				})
			);
		});

		it('should evaluate eligibility timeline accurately: no credit just below threshold, credits exactly on threshold, and is idempotent on subsequent runs', async () => {
			vi.clearAllMocks();

			// Setup female employee for ML policy (min_service_days: 80, annual_limit: 180)
			const femaleEmployee = { ...mockEmployee, gender: 'Female' };
			vi.mocked(db.employee.findUnique).mockResolvedValue(femaleEmployee as any);
			vi.mocked(db.employee.findFirst).mockResolvedValue(femaleEmployee as any);

			// 1. Service days just below threshold (e.g. 79 days). Join date 79 days before current system time.
			const systemTime = new Date('2026-06-15T12:00:00.000Z');
			vi.setSystemTime(systemTime);

			const testEmploymentBelow = {
				...mockEmployment,
				date_of_joining: new Date(systemTime.getTime() - 79 * 24 * 60 * 60 * 1000)
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmploymentBelow as any);
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Should NOT credit (createLeaveBalance shouldn't be called for ML)
			expect(leaveDao.createLeaveBalance).not.toHaveBeenCalledWith(
				expect.objectContaining({ leave_type_cuid: 'cuid-ml' })
			);

			// 2. Exactly meeting minimum service days (80 days). Join date exactly 80 days before system time.
			vi.clearAllMocks();
			const testEmploymentOn = {
				...mockEmployment,
				date_of_joining: new Date(systemTime.getTime() - 80 * 24 * 60 * 60 * 1000)
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmploymentOn as any);
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Should credit ML (createLeaveBalance called with 180 days)
			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-ml',
					allocated_days: 180.0,
					remaining_days: 180.0
				})
			);

			// 3. Subsequent run: Re-run accrual when balance already exists.
			vi.clearAllMocks();
			// Mock that balance already exists (180 allocated, 5 used, 175 remaining)
			const existingBal = {
				cuid: 'existing-ml-bal-cuid',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-ml',
				year: 2026,
				allocated_days: 180.0,
				used_days: 5.0,
				remaining_days: 175.0,
				carried_forward_days: 0.0
			};
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(existingBal as any);
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmploymentOn as any);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Should NOT call createLeaveBalance (idempotent, no duplicates)
			expect(leaveDao.createLeaveBalance).not.toHaveBeenCalled();

			// Should update the balance but keep it correct (180 allocated, 175 remaining)
			expect(leaveDao.updateLeaveBalance).toHaveBeenCalledWith(
				'existing-ml-bal-cuid',
				expect.objectContaining({
					allocated_days: 180.0,
					remaining_days: 175.0
				})
			);
		});

		it('should automatically credit generic policy-defined gender-specific leaves when employee matches conditions', async () => {
			vi.clearAllMocks();

			// Add a custom generic gender-specific leave type: Custom Gender Leave (CGL)
			const customLeaveType = { cuid: 'cuid-cgl', code: 'CGL', name: 'Custom Gender Leave', is_paid: true, requires_approval: true };
			const customPolicy = {
				cuid: 'p-cgl',
				leave_type_cuid: 'cuid-cgl',
				annual_limit: 10,
				max_per_month: null,
				carry_forward_allowed: false,
				min_service_days: 30,
				allow_half_day: false,
				gender_specific: true,
				applicable_gender: 'Female',
				status: true
			};

			const mockTypesExtended = [...mockLeaveTypes, customLeaveType];
			const mockPoliciesExtended = { ...mockPolicies, 'cuid-cgl': customPolicy };

			vi.mocked(leaveDao.listLeaveTypes).mockResolvedValue(mockTypesExtended as any);
			vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: string) => {
				return mockPoliciesExtended[cuid as keyof typeof mockPoliciesExtended] || null;
			});

			// Setup female employee (meets min_service_days)
			const femaleEmployee = { ...mockEmployee, gender: 'Female' };
			vi.mocked(db.employee.findUnique).mockResolvedValue(femaleEmployee as any);
			vi.mocked(db.employee.findFirst).mockResolvedValue(femaleEmployee as any);

			const systemTime = new Date('2026-06-15T12:00:00.000Z');
			vi.setSystemTime(systemTime);

			const testEmploymentMeets = {
				...mockEmployment,
				date_of_joining: new Date(systemTime.getTime() - 40 * 24 * 60 * 60 * 1000) // 40 days (> 30 days)
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmploymentMeets as any);
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Female employee meeting conditions should get generic credit
			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-cgl',
					allocated_days: 10.0,
					remaining_days: 10.0
				})
			);

			// Setup male employee
			vi.clearAllMocks();
			const maleEmployee = { ...mockEmployee, gender: 'Male' };
			vi.mocked(db.employee.findUnique).mockResolvedValue(maleEmployee as any);
			vi.mocked(db.employee.findFirst).mockResolvedValue(maleEmployee as any);
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmploymentMeets as any);

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Male employee should NOT get generic credit
			expect(leaveDao.createLeaveBalance).not.toHaveBeenCalledWith(
				expect.objectContaining({
					leave_type_cuid: 'cuid-cgl'
				})
			);
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

		it('should accept a leave request with a valid document (size <= 2 MB)', async () => {
			const validBase64 = Buffer.from('Mock content').toString('base64');
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-req-cuid' } as any);
			vi.mocked(leaveDao.getOverlappingRequests).mockResolvedValue([]);

			const result = await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-15',
				isHalfDay: false,
				document: {
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					base64Data: validBase64
				}
			});

			expect(result).toBeDefined();
			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					file_name: 'test.pdf',
					mime_type: 'application/pdf',
					file_size: Buffer.from('Mock content').length
				})
			);
		});

		it('should reject a leave request with a document exceeding 2 MB', async () => {
			// Create a buffer larger than 2 MB
			const largeBuffer = Buffer.alloc(2 * 1024 * 1024 + 10);
			const largeBase64 = largeBuffer.toString('base64');

			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-15',
				isHalfDay: false,
				document: {
					fileName: 'large.pdf',
					mimeType: 'application/pdf',
					base64Data: largeBase64
				}
			})).rejects.toThrow('Uploaded document must be less than or equal to 2 MB.');
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

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([
				{ days_from_primary: 1.0, start_date: new Date('2026-01-10T00:00:00Z'), request_status: 'approved' }
			]);
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

		it('should automatically split EL request into LOP when balance is exceeded', async () => {
			// EL balance is 5 days, requesting 7 days (June 15 to June 23, excluding weekends = 7 days)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string) => {
				if (typeCuid === 'cuid-el') {
					return { cuid: 'bal-el', remaining_days: 5.0 } as any;
				}
				if (typeCuid === 'cuid-lop') {
					return { cuid: 'bal-lop', remaining_days: 0.0 } as any;
				}
				return null;
			});

			vi.mocked(db.leaveType.findFirst).mockResolvedValue({ cuid: 'cuid-lop', code: 'LOP' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-15',
				endDate: '2026-06-23',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 5.0,
				days_from_lop: 4.0
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
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', name: 'Casual Leave', code: 'CL' });
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
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-el', name: 'Earned Leave', code: 'EL' });
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
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', name: 'Casual Leave', code: 'CL' });
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
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', name: 'Casual Leave', code: 'CL' });
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

		it('should grant prorated EL credit for the year if employee has resigned/relieved in that year', async () => {
			const resignedEmployment = {
				...mockEmployment,
				employment_status: 'active',
				relieving_date: new Date('2026-08-15T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(resignedEmployment as any);
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue(null); // Force creation

			await leaveService.accrueLeaves('emp-cuid', 2026);

			// Expected: Jan to Aug 15th = 7 months + 15/31 = 7.48387 months. EL limit = 12, so 7.48387 days.
			expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
				leave_type_cuid: 'cuid-el',
				allocated_days: expect.closeTo(7.484, 2)
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

		describe('max_annual_carry_forward_days and max_carry_forward_days Integration Scenarios', () => {
			const scenarios = [
				{ prevCf: 0.0, unusedEl: 12.0, annualCap: 6.0, totalCap: 24.0, expectedCf: 6.0 },
				{ prevCf: 6.0, unusedEl: 12.0, annualCap: 6.0, totalCap: 24.0, expectedCf: 12.0 },
				{ prevCf: 20.0, unusedEl: 12.0, annualCap: 6.0, totalCap: 24.0, expectedCf: 24.0 },
				{ prevCf: 20.0, unusedEl: 12.0, annualCap: 4.0, totalCap: 24.0, expectedCf: 24.0 },
				{ prevCf: 0.0, unusedEl: 12.0, annualCap: 4.0, totalCap: 24.0, expectedCf: 4.0 }
			];

			scenarios.forEach(({ prevCf, unusedEl, annualCap, totalCap, expectedCf }, idx) => {
				it(`should calculate carry-forward correctly for Scenario ${idx + 1}: prevCf=${prevCf}, unusedEl=${unusedEl}, annualCap=${annualCap}, totalCap=${totalCap} => expectedCf=${expectedCf}`, async () => {
					// We mock the previous year's balance (2025)
					// allocated_days = unusedEl + used_days (let's say used_days is 0, so allocated_days = unusedEl)
					const prevBalance = {
						cuid: 'prev-bal-el',
						allocated_days: unusedEl,
						carried_forward_days: prevCf,
						used_days: 0.0,
						remaining_days: unusedEl + prevCf
					};

					vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: string, typeCuid: string, year?: number) => {
						if (typeCuid === 'cuid-el' && year === 2025) return prevBalance as any;
						return null;
					});

					// Mock the custom policy
					const customPolicy = {
						cuid: 'p-el',
						leave_type_cuid: 'cuid-el',
						annual_limit: 12.0,
						max_per_month: 1.0,
						carry_forward_allowed: true,
						min_service_days: 365,
						allow_half_day: false,
						gender_specific: false,
						status: true,
						max_annual_carry_forward_days: annualCap,
						max_carry_forward_days: totalCap
					};
					vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: string) => {
						if (cuid === 'cuid-el') return customPolicy as any;
						return mockPolicies[cuid as keyof typeof mockPolicies] || null;
					});

					const testEmployment = {
						...mockEmployment,
						date_of_joining: new Date('2024-01-01T00:00:00.000Z')
					};
					vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

					await leaveService.accrueLeaves('emp-cuid', 2026);

					expect(leaveDao.createLeaveBalance).toHaveBeenCalledWith(expect.objectContaining({
						leave_type_cuid: 'cuid-el',
						carried_forward_days: expectedCf
					}));
				});
			});
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

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([
				{ days_from_primary: 2.0, start_date: new Date('2026-01-10T00:00:00Z'), request_status: 'approved' }
			]);
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
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (empCuid: any, typeCuid: any) => {
				if (typeCuid === 'cuid-sl') {
					return { cuid: 'bal-sl', remaining_days: 1.0 } as any;
				}
				return null;
			});

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([
				{ days_from_primary: 2.0, start_date: new Date('2026-01-10T00:00:00Z'), request_status: 'approved' }
			]);
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

		it('should not update or create leaveBalance records for LOP/LWP in approveLeaveRequest', async () => {
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
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', name: 'Casual Leave', code: 'CL' });
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lop', name: 'Loss of Pay', code: 'LOP' });
			
			// Mock finding LOP balance returns null (does not exist yet)
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-lop-123', 'admin-cuid');

			// Check that leaveBalance.create was NOT called for LOP
			expect(db.leaveBalance.create).not.toHaveBeenCalled();
			expect(db.leaveBalance.update).not.toHaveBeenCalled();
		});

		it('should return dynamically calculated monthly LOP/LWP used days in getEmployeeLeaveDetails', async () => {
			const mockRequest1 = {
				cuid: 'req-lop-1',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-10T00:00:00Z'),
				end_date: new Date('2026-06-12T00:00:00Z'), // 3 days
				total_days: 3.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 1.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			};

			const mockRequest2 = {
				cuid: 'req-lop-2',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-05-15T00:00:00Z'),
				end_date: new Date('2026-05-17T00:00:00Z'), // 3 days (previous month)
				total_days: 3.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 3.0
			};

			// Mock findMany for getMonthlyUsedDays
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([mockRequest1, mockRequest2]);
			
			// Mock leaveTypes list
			vi.mocked(leaveDao.listLeaveTypes).mockResolvedValue([
				{ cuid: 'cuid-sl', name: 'Sick Leave', code: 'SL' },
				{ cuid: 'cuid-lop', name: 'Loss of Pay', code: 'LOP' },
				{ cuid: 'cuid-lwp', name: 'Leave Without Pay', code: 'LWP' }
			] as any);

			vi.mocked(leaveDao.getLeaveBalances).mockResolvedValue([]);
			vi.mocked(leaveDao.getLeaveRequests).mockResolvedValue([]);
			vi.mocked(leaveDao.getSubordinates).mockResolvedValue([]);

			// Mock system date to 2026-06-15
			vi.setSystemTime(new Date('2026-06-15T10:00:00.000Z'));

			const result = await leaveService.getEmployeeLeaveDetails('john@pieq.ai', 2026);

			// Only Request 1 falls in June 2026 (targetMonth = 5/June).
			expect(result.lopUsed).toBe(2.0);
		});

		it('should verify LWP monthly balance in applyLeave and reject if exceeded', async () => {
			const mockLwpPolicy = {
				cuid: 'p-lwp',
				leave_type_cuid: 'cuid-lwp',
				annual_limit: 5.0, // limit is 5 days per month (treated monthly)
				status: true
			};
			vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: any) => {
				if (cuid === 'cuid-lwp') return mockLwpPolicy as any;
				return null;
			});

			const mockRequest = {
				cuid: 'req-lwp-1',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-lwp',
				start_date: new Date('2026-06-10T00:00:00Z'),
				end_date: new Date('2026-06-13T00:00:00Z'), // 4 days LWP
				total_days: 4.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 4.0,
				days_from_lop: 0.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([mockRequest]);
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lwp', name: 'Leave Without Pay', code: 'LWP' });

			// Requesting 2 LWP days in June (June 15 to June 16).
			// Since 4 LWP days are already used in June, and limit is 5, requesting 2 more should fail!
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-lwp',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			})).rejects.toThrow('Requested leave exceeds available balance. You can only take 1 LWP day(s) this month (1 day(s) would exceed the monthly cap).');
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
	});

	describe('Comprehensive LOP/LWP Scenarios', () => {
		// ─────────────────────────────────────────────────────────────────────
		// Helper builders
		// ─────────────────────────────────────────────────────────────────────
		function buildRequest(overrides: Partial<{
			cuid: string;
			employee_cuid: string;
			leave_type_cuid: string;
			start_date: Date;
			end_date: Date;
			total_days: number;
			is_half_day: boolean;
			request_status: string;
			days_from_primary: number;
			days_from_lwp: number;
			days_from_lop: number;
		}>) {
			return {
				cuid: 'req-test',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-19T00:00:00Z'),
				total_days: 5.0,
				is_half_day: false,
				half_day_session: null,
				reason: 'Test',
				document_url: null,
				request_status: 'pending',
				days_from_primary: 5.0,
				days_from_lwp: 0.0,
				days_from_lop: 0.0,
				created_at: new Date(),
				...overrides
			};
		}

		// ─────────────────────────────────────────────────────────────────────
		// 1. SL + LOP split — applyLeave & approveLeaveRequest
		// ─────────────────────────────────────────────────────────────────────
		it('should compute SL+LOP split correctly in applyLeave when SL balance is exceeded', async () => {
			// SL balance: 2 days. Requesting 5 days (Mon–Fri: Jun 15–19).
			// Expected: days_from_primary=2, days_from_lop=3
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-sl') return { cuid: 'bal-sl', remaining_days: 2.0 } as any;
				return null;
			});
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([
				{ days_from_primary: 1.0, start_date: new Date('2026-01-10T00:00:00Z'), request_status: 'approved' }
			]);
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-sl-lop' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-19',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 2.0,
				days_from_lop: 3.0,
				days_from_lwp: 0.0
			}));
		});

		it('should deduct only primary (SL) balance and NOT update LOP balance row when approving SL+LOP split', async () => {
			// Request: 5 days SL — 2 primary SL + 3 LOP
			const mockRequest = buildRequest({
				cuid: 'req-sl-lop',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-19T00:00:00Z'),
				total_days: 5.0,
				days_from_primary: 2.0,
				days_from_lwp: 0.0,
				days_from_lop: 3.0
			});

			const mockSlBalance = {
				cuid: 'bal-sl',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				year: 2026,
				remaining_days: 2.0
			};

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-sl', name: 'Sick Leave', code: 'SL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockSlBalance);
			vi.mocked(db.leaveRequest.update as any).mockResolvedValue({ ...mockRequest, request_status: 'approved' });
			vi.mocked(db.attendanceRecord.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-sl-lop', 'admin-cuid');

			// SL balance must be decremented by 2.0 (only days_from_primary)
			expect(db.leaveBalance.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { cuid: 'bal-sl' },
				data: {
					used_days: { increment: 2.0 },
					remaining_days: { decrement: 2.0 }
				}
			}));

			// No LOP LeaveBalance rows must be created or updated
			expect(db.leaveBalance.create).not.toHaveBeenCalled();
			// update should have been called exactly once (for SL), not for LOP
			expect(db.leaveBalance.update).toHaveBeenCalledTimes(1);

			// Attendance records should be created for all 5 working days (Mon–Fri)
			expect(db.attendanceRecord.upsert).toHaveBeenCalledTimes(5);
		});

		it('should include LOP count in attendance remark for SL+LOP split approval', async () => {
			const mockRequest = buildRequest({
				cuid: 'req-sl-lop-remark',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-16T00:00:00Z'),
				total_days: 2.0,
				days_from_primary: 1.0,
				days_from_lwp: 0.0,
				days_from_lop: 1.0
			});

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-sl', name: 'Sick Leave', code: 'SL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue({ cuid: 'bal-sl', remaining_days: 1.0, employee_cuid: 'emp-cuid', leave_type_cuid: 'cuid-sl', year: 2026 });
			vi.mocked(db.leaveRequest.update as any).mockResolvedValue({ ...mockRequest, request_status: 'approved' });
			vi.mocked(db.attendanceRecord.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-sl-lop-remark', 'admin-cuid');

			// Attendance remark should mention LOP split
			expect(db.attendanceRecord.upsert).toHaveBeenCalledWith(expect.objectContaining({
				create: expect.objectContaining({
					remarks: 'Approved Leave: Sick Leave (incl. 1 LOP day)'
				})
			}));
		});

		// ─────────────────────────────────────────────────────────────────────
		// 2. CL + LOP split
		// ─────────────────────────────────────────────────────────────────────
		it('should compute CL+LOP split correctly in applyLeave when CL balance is 1 day and 2 days requested', async () => {
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-cl') return { cuid: 'bal-cl', remaining_days: 1.0 } as any;
				return null;
			});
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([
				{ days_from_primary: 2.0, start_date: new Date('2026-01-10T00:00:00Z'), request_status: 'approved' }
			]);
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-cl-lop' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 1.0,
				days_from_lop: 1.0,
				days_from_lwp: 0.0
			}));
		});

		it('should deduct only CL balance and not create LOP balance row when approving CL+LOP split', async () => {
			const mockRequest = buildRequest({
				cuid: 'req-cl-lop',
				leave_type_cuid: 'cuid-cl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-16T00:00:00Z'),
				total_days: 2.0,
				days_from_primary: 1.0,
				days_from_lwp: 0.0,
				days_from_lop: 1.0
			});
			const mockClBalance = { cuid: 'bal-cl', remaining_days: 1.0, employee_cuid: 'emp-cuid', leave_type_cuid: 'cuid-cl', year: 2026 };

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-cl', name: 'Casual Leave', code: 'CL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockClBalance);
			vi.mocked(db.leaveRequest.update as any).mockResolvedValue({ ...mockRequest, request_status: 'approved' });
			vi.mocked(db.attendanceRecord.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-cl-lop', 'admin-cuid');

			expect(db.leaveBalance.update).toHaveBeenCalledTimes(1);
			expect(db.leaveBalance.update).toHaveBeenCalledWith(expect.objectContaining({
				data: { used_days: { increment: 1.0 }, remaining_days: { decrement: 1.0 } }
			}));
			expect(db.leaveBalance.create).not.toHaveBeenCalled();
			expect(db.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
		});

		// ─────────────────────────────────────────────────────────────────────
		// 3. Fully exhausted balance → all days LOP
		// ─────────────────────────────────────────────────────────────────────
		it('should allow SL application when balance is 0 — all days become LOP', async () => {
			// SL balance 0, requesting 3 days → days_from_primary=0, days_from_lop=3
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-sl') return { cuid: 'bal-sl', remaining_days: 0.0 } as any;
				return null;
			});
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([
				{ days_from_primary: 3.0, start_date: new Date('2026-01-10T00:00:00Z'), request_status: 'approved' }
			]);
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-lop-only' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-17',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 0.0,
				days_from_lop: 3.0,
				days_from_lwp: 0.0
			}));
		});

		it('should approve LOP-only SL request (days_from_primary=0) without touching any LeaveBalance', async () => {
			// All 3 days are LOP — no primary balance to deduct
			const mockRequest = buildRequest({
				cuid: 'req-all-lop',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-17T00:00:00Z'),
				total_days: 3.0,
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 3.0
			});

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-sl', name: 'Sick Leave', code: 'SL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(null); // no SL balance
			vi.mocked(db.leaveRequest.update as any).mockResolvedValue({ ...mockRequest, request_status: 'approved' });
			vi.mocked(db.attendanceRecord.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-all-lop', 'admin-cuid');

			// No balance row should be updated or created
			expect(db.leaveBalance.update).not.toHaveBeenCalled();
			expect(db.leaveBalance.create).not.toHaveBeenCalled();

			// But attendance records MUST be created for all 3 working days
			expect(db.attendanceRecord.upsert).toHaveBeenCalledTimes(3);
		});

		// ─────────────────────────────────────────────────────────────────────
		// 4. Monthly LOP counter reset — isolation between months
		// ─────────────────────────────────────────────────────────────────────
		it('should return only current-month LOP days and NOT include previous months in getMonthlyUsedDays', async () => {
			// May: 3 LOP days (req-may)
			// June: 2 LOP days (req-jun)
			// When querying for June, only 2 days should be returned

			const mayRequest = {
				cuid: 'req-may',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-05-14T00:00:00Z'), // Thu
				end_date: new Date('2026-05-16T00:00:00Z'),   // Sat — 2 working days (Thu+Fri)
				total_days: 3.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 3.0
			};

			const junRequest = {
				cuid: 'req-jun',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-15T00:00:00Z'), // Mon
				end_date: new Date('2026-06-16T00:00:00Z'),   // Tue
				total_days: 2.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([mayRequest, junRequest]);

			// getMonthlyUsedDays for June (month index 5)
			const juneLop = await leaveService.getMonthlyUsedDays('emp-cuid', 5, 2026, 'LOP');
			expect(juneLop).toBe(2);

			// And for May (month index 4) — should return 3 (Thu+Fri+Sat, Sat included as weekend under sandwich rule)
			const mayLop = await leaveService.getMonthlyUsedDays('emp-cuid', 4, 2026, 'LOP');
			expect(mayLop).toBe(3);
		});

		it('should isolate LOP months correctly in getEmployeeLeaveDetails dashboard', async () => {
			// Only June LOP should appear in the dashboard LOP card when system date is June 2026
			const mayRequest = {
				cuid: 'req-may-2',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-05-14T00:00:00Z'),
				end_date: new Date('2026-05-14T00:00:00Z'),
				total_days: 1.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 1.0
			};

			const junRequest = {
				cuid: 'req-jun-2',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-16T00:00:00Z'),
				end_date: new Date('2026-06-17T00:00:00Z'),
				total_days: 2.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([mayRequest, junRequest]);
			vi.mocked(leaveDao.getLeaveBalances).mockResolvedValue([]);
			vi.mocked(leaveDao.getLeaveRequests).mockResolvedValue([]);
			vi.mocked(leaveDao.getSubordinates).mockResolvedValue([]);
			vi.mocked(leaveDao.listLeaveTypes).mockResolvedValue([
				{ cuid: 'cuid-sl', name: 'Sick Leave', code: 'SL' },
				{ cuid: 'cuid-lop', name: 'Loss of Pay', code: 'LOP' },
				{ cuid: 'cuid-lwp', name: 'Leave Without Pay', code: 'LWP' }
			] as any);

			// System date: June 16, 2026
			vi.setSystemTime(new Date('2026-06-16T10:00:00.000Z'));

			const result = await leaveService.getEmployeeLeaveDetails('john@pieq.ai', 2026);
			// Only June LOP (2 days) should be shown — May (1 day) must NOT bleed in
			expect(result.lopUsed).toBe(2);
		});

		// ─────────────────────────────────────────────────────────────────────
		// 5. EL → LWP split approval
		// ─────────────────────────────────────────────────────────────────────
		it('should compute EL+LOP split in applyLeave and not write LOP LeaveBalance during approve', async () => {
			// EL balance: 3 days. Requesting 5 days (Jun 15–19). Split: 3 EL + 2 LOP.
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-el') return { cuid: 'bal-el', remaining_days: 3.0 } as any;
				return null;
			});
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lop', code: 'LOP' });
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-el-lop' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-15',
				endDate: '2026-06-19',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 3.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			}));
		});

		it('should deduct EL balance and NOT write LOP balance during EL+LOP split approval', async () => {
			const mockRequest = buildRequest({
				cuid: 'req-el-lop',
				leave_type_cuid: 'cuid-el',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-19T00:00:00Z'),
				total_days: 5.0,
				days_from_primary: 3.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			});

			const mockElBalance = { cuid: 'bal-el', remaining_days: 3.0, employee_cuid: 'emp-cuid', leave_type_cuid: 'cuid-el', year: 2026 };

			vi.mocked(db.leaveRequest.findUnique as any).mockResolvedValue(mockRequest);
			vi.mocked(db.leaveType.findUnique as any).mockResolvedValue({ cuid: 'cuid-el', name: 'Earned Leave', code: 'EL' });
			vi.mocked(db.leaveBalance.findUnique as any).mockResolvedValue(mockElBalance);
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lop', code: 'LOP' });
			vi.mocked(db.leavePolicy.findFirst as any).mockResolvedValue({ leave_type_cuid: 'cuid-lop', annual_limit: 365, status: true });
			vi.mocked(db.leaveRequest.update as any).mockResolvedValue({ ...mockRequest, request_status: 'approved' });
			vi.mocked(db.attendanceRecord.findUnique as any).mockResolvedValue(null);

			await leaveService.approveLeaveRequest('req-el-lop', 'admin-cuid');

			// EL balance decremented by 3
			expect(db.leaveBalance.update).toHaveBeenCalledTimes(1);
			expect(db.leaveBalance.update).toHaveBeenCalledWith(expect.objectContaining({
				data: { used_days: { increment: 3.0 }, remaining_days: { decrement: 3.0 } }
			}));
			// No LOP balance written
			expect(db.leaveBalance.create).not.toHaveBeenCalled();

			// Attendance remark includes LOP mention
			expect(db.attendanceRecord.upsert).toHaveBeenCalledWith(expect.objectContaining({
				create: expect.objectContaining({
					remarks: 'Approved Leave: Earned Leave (incl. 2 LOP days)'
				})
			}));
		});

		// ─────────────────────────────────────────────────────────────────────
		// 6. LWP monthly limit validation in applyLeave
		// ─────────────────────────────────────────────────────────────────────
		it('should allow LWP application when monthly LWP usage is within the monthly cap', async () => {
			// LWP policy: annual_limit=10 (treated as monthly cap).
			// Already used 5 LWP days in June. Requesting 5 more → still within cap.
			const mockLwpPolicy = { cuid: 'p-lwp', leave_type_cuid: 'cuid-lwp', annual_limit: 10.0, status: true };
			vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: any) => {
				if (cuid === 'cuid-lwp') return mockLwpPolicy as any;
				return null;
			});

			const existingRequest = {
				cuid: 'req-lwp-existing',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-lwp',
				start_date: new Date('2026-06-01T00:00:00Z'),
				end_date: new Date('2026-06-05T00:00:00Z'),
				total_days: 5.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 5.0,
				days_from_lop: 0.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([existingRequest]);
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lwp', code: 'LWP' });
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-lwp' } as any);

			// Requesting 5 more LWP days → exactly at cap → should succeed
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-lwp',
				startDate: '2026-06-08',
				endDate: '2026-06-12',
				isHalfDay: false
			})).resolves.not.toThrow();
		});

		it('should reject LWP application when monthly LWP usage would exceed the monthly cap', async () => {
			// LWP policy: annual_limit=5 (treated as monthly cap).
			// Already used 4 LWP days in June. Requesting 2 more → exceeds by 1.
			const mockLwpPolicy = { cuid: 'p-lwp', leave_type_cuid: 'cuid-lwp', annual_limit: 5.0, status: true };
			vi.mocked(leaveDao.getLeavePolicyByLeaveType).mockImplementation(async (cuid: any) => {
				if (cuid === 'cuid-lwp') return mockLwpPolicy as any;
				return null;
			});

			const existingRequest = {
				cuid: 'req-lwp-used',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-lwp',
				start_date: new Date('2026-06-01T00:00:00Z'),
				end_date: new Date('2026-06-04T00:00:00Z'),
				total_days: 4.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 4.0,
				days_from_lop: 0.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([existingRequest]);
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lwp', code: 'LWP' });

			// Requesting 2 LWP days → only 1 remains → should fail
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-lwp',
				startDate: '2026-06-15',
				endDate: '2026-06-16',
				isHalfDay: false
			})).rejects.toThrow(/You can only take 1 LWP day\(s\) this month/);
		});

		// ─────────────────────────────────────────────────────────────────────
		// 7. LOP does not affect CL (other leave types stay independent)
		// ─────────────────────────────────────────────────────────────────────
		it('should not affect CL balance when LOP days accrue for a different leave type (SL)', async () => {
			// Scenario: Employee has 5 SL LOP days in June. Their CL balance is unaffected.
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-cl') return { cuid: 'bal-cl', remaining_days: 5.0 } as any;
				if (typeCuid === 'cuid-sl') return { cuid: 'bal-sl', remaining_days: 0.0 } as any;
				return null;
			});
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-cl' } as any);

			// Apply 1 CL day — should succeed with days_from_primary=1, days_from_lop=0
			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-15',
				endDate: '2026-06-15',
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 1.0,
				days_from_lop: 0.0,
				days_from_lwp: 0.0
			}));
		});

		// ─────────────────────────────────────────────────────────────────────
		// New Custom LOP/LWP Scenarios
		// ─────────────────────────────────────────────────────────────────────
		it('should handle sufficient balance request with no LOP', async () => {
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-el') return { cuid: 'bal-el', remaining_days: 10.0 } as any;
				return null;
			});
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-el-sufficient' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-15',
				endDate: '2026-06-18', // 4 days (Mon-Thu)
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 4.0,
				days_from_lop: 0.0,
				days_from_lwp: 0.0
			}));
		});

		it('should handle partial balance + partial LOP request', async () => {
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-el') return { cuid: 'bal-el', remaining_days: 2.0 } as any;
				return null;
			});
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-el-partial' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-06-15',
				endDate: '2026-06-19', // 5 days (Mon-Fri)
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 2.0,
				days_from_lop: 3.0,
				days_from_lwp: 0.0
			}));
		});

		it('should correctly assign LOP days spanning cutoff boundaries', async () => {
			// Employee has 2 EL remaining. Request is June 23 to June 26 (4 working days: Tue, Wed, Thu, Fri).
			// Split: 2 primary EL, 2 LOP.
			// Active dates: June 23, June 24, June 25, June 26.
			// First 2 are EL: June 23, June 24.
			// Remaining 2 are LOP: June 25, June 26.
			// LOP split across cutoff 25:
			// June 25 LOP belongs to June payroll cycle (month = 5).
			// June 26 LOP belongs to July payroll cycle (month = 6).
			const mockRequest = {
				cuid: 'req-spanning-cutoff',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-el',
				start_date: new Date('2026-06-23T00:00:00Z'),
				end_date: new Date('2026-06-26T00:00:00Z'),
				total_days: 4.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 2.0,
				days_from_lwp: 0.0,
				days_from_lop: 2.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([mockRequest]);
			leaveService.setPayrollCutoffDay(25);

			// June LOP (month index 5, cycle May 26 - June 25)
			const juneLop = await leaveService.getMonthlyUsedDays('emp-cuid', 5, 2026, 'LOP');
			// July LOP (month index 6, cycle June 26 - July 25)
			const julyLop = await leaveService.getMonthlyUsedDays('emp-cuid', 6, 2026, 'LOP');

			expect(juneLop).toBe(1.0); // June 25 LOP day
			expect(julyLop).toBe(1.0); // June 26 LOP day
		});

		it('should automatically convert future month excess leave to LOP', async () => {
			// August 2026 (future month) request for 3 EL days. Available balance is 0.
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-el') return { cuid: 'bal-el', remaining_days: 0.0 } as any;
				return null;
			});
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-el-future' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-el',
				startDate: '2026-08-03', // Mon
				endDate: '2026-08-05',   // Wed
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 0.0,
				days_from_lop: 3.0,
				days_from_lwp: 0.0
			}));
		});

		it('should verify pure LWP requests do not get assigned to LOP', async () => {
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-lwp-pure' } as any);
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([]);
			vi.mocked(db.leaveType.findFirst as any).mockResolvedValue({ cuid: 'cuid-lwp', name: 'Leave Without Pay', code: 'LWP' });

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-lwp',
				startDate: '2026-06-15',
				endDate: '2026-06-18', // 4 days (Mon-Thu)
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 0.0,
				days_from_lop: 0.0,
				days_from_lwp: 4.0
			}));
		});

		it('should correctly handle mixed leave requests crossing multiple payroll cycles', async () => {
			// Request 1: June 20 to June 24 (all LOP, 3 working days: Mon June 22, Tue June 23, Wed June 24) => June cycle
			// Request 2: June 25 to June 30 (all LOP, 4 working days: Thu June 25, Fri June 26, Mon June 29, Tue June 30) => June 25 is June cycle, others are July cycle
			const mockRequest1 = {
				cuid: 'req-mixed-1',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-20T00:00:00Z'),
				end_date: new Date('2026-06-24T00:00:00Z'),
				total_days: 3.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 3.0
			};

			const mockRequest2 = {
				cuid: 'req-mixed-2',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-25T00:00:00Z'),
				end_date: new Date('2026-06-30T00:00:00Z'),
				total_days: 4.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 4.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([mockRequest1, mockRequest2]);
			leaveService.setPayrollCutoffDay(25);

			// June LOP:
			// Request 1 LOP days (June 22, 23, 24) = 3 days
			// Request 2 LOP days (June 25) = 1 day
			// Total = 4 days
			const juneLop = await leaveService.getMonthlyUsedDays('emp-cuid', 5, 2026, 'LOP');

			// July LOP:
			// Request 2 LOP days (June 26, 29, 30) = 3 days
			// Total = 3 days
			const julyLop = await leaveService.getMonthlyUsedDays('emp-cuid', 6, 2026, 'LOP');

			expect(juneLop).toBe(4.0);
			expect(julyLop).toBe(3.0);
		});
	});

	describe('CL/SL Accrual Capping and LOP reset Scenarios', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-07-15T12:00:00.000Z')); // Current month: July
		});

		it('should never borrow from future CL/SL accruals when applying for leave in past or future months', async () => {
			// Joining date is Jan 2025. Current month is July 2026.
			// Employee applies for 5.0 SL days in June 2026 retrospectively.
			// June's accrued SL is capped at June's accrual limit: 3.0 days.
			// Result: 3.0 days primary SL consumed, 2.0 days LOP.
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue({ cuid: 'bal-sl', employee_cuid: 'emp-cuid', leave_type_cuid: 'cuid-sl', year: 2026, carried_forward_days: 0.0 } as any);
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([]); // No previous approved SL
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-sl-req' } as any);

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-sl',
				startDate: '2026-06-15',
				endDate: '2026-06-19', // 5 working days (Mon-Fri)
				isHalfDay: false
			});

			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
				days_from_primary: 3.0,
				days_from_lop: 2.0
			}));
		});

		it('should correctly calculate July available CL balance as 0.5 days after June overuse of 3.0 CL + 2.0 LOP', async () => {
			// June approved request: start_date in June, days_from_primary = 3.0.
			// When calculating available balance in July, July accrues up to July: 3.5 days.
			// Less June's primary CL used: 3.0.
			// Remaining July balance: 3.5 - 3.0 = 0.5 CL available. June's 2.0 LOP did not reduce July's accrual.
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue({ cuid: 'bal-cl', employee_cuid: 'emp-cuid', leave_type_cuid: 'cuid-cl', year: 2026, carried_forward_days: 0.0 } as any);
			
			const JuneApprovedRequest = {
				cuid: 'req-june',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-cl',
				start_date: new Date('2026-06-15T00:00:00Z'),
				end_date: new Date('2026-06-19T00:00:00Z'),
				total_days: 5.0,
				request_status: 'approved',
				days_from_primary: 3.0,
				days_from_lop: 2.0,
				days_from_lwp: 0.0
			};
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([JuneApprovedRequest]);

			const julyBalance = await leaveService.getAvailableBalanceForMonth('emp-cuid', 'cuid-cl', 2026, 6); // July (month index 6)
			expect(julyBalance).toBe(0.5);
		});
	});

	describe('Cutoff and Date Validation Scenarios', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z')); // Local time mock: June 15
		});

		it('should reject CL/SL request in a future month', async () => {
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-07-01',
				endDate: '2026-07-02',
				isHalfDay: false
			})).rejects.toThrow('Casual Leave (CL) and Sick Leave (SL) cannot be applied for future months.');
		});

		it('should reject CL/SL request spanning multiple months', async () => {
			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-05-29',
				endDate: '2026-06-01',
				isHalfDay: false
			})).rejects.toThrow('Casual Leave (CL) and Sick Leave (SL) requests cannot span multiple months.');
		});

		it('should allow retrospective CL/SL request in the current or past months', async () => {
			vi.mocked(leaveDao.getLeaveBalance).mockResolvedValue({ cuid: 'bal-cl', employee_cuid: 'emp-cuid', leave_type_cuid: 'cuid-cl', year: 2026, carried_forward_days: 0.0 } as any);
			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([]);
			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-req' } as any);

			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-cl',
				startDate: '2026-06-10',
				endDate: '2026-06-11',
				isHalfDay: false
			})).resolves.not.toThrow();
		});

		it('should get payroll cutoff day with fallback to 25 and update via setter', async () => {
			// Test fallback
			const fallbackVal = await leaveService.getPayrollCutoffDay();
			expect(fallbackVal).toBe(25);

			// Test configured setting
			leaveService.setPayrollCutoffDay(20);
			const configuredVal = await leaveService.getPayrollCutoffDay();
			expect(configuredVal).toBe(20);

			// Reset to default
			leaveService.setPayrollCutoffDay(25);
		});

		it('should assign LOP days to June or July payroll cycle based on cutoff day 25', async () => {
			// June 24 LOP should belong to June cycle (cutoff 25).
			// June 29 LOP should belong to July cycle (weekday Monday).
			// Target LOP leaves inside DB:
			const mockLopRequestJune24 = {
				cuid: 'req-june-24',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-24T00:00:00Z'),
				end_date: new Date('2026-06-24T00:00:00Z'),
				total_days: 1.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 1.0
			};

			const mockLopRequestJune29 = {
				cuid: 'req-june-29',
				employee_cuid: 'emp-cuid',
				leave_type_cuid: 'cuid-sl',
				start_date: new Date('2026-06-29T00:00:00Z'),
				end_date: new Date('2026-06-29T00:00:00Z'),
				total_days: 1.0,
				is_half_day: false,
				request_status: 'approved',
				days_from_primary: 0.0,
				days_from_lwp: 0.0,
				days_from_lop: 1.0
			};

			vi.mocked(db.leaveRequest.findMany as any).mockResolvedValue([
				mockLopRequestJune24,
				mockLopRequestJune29
			]);
			leaveService.setPayrollCutoffDay(25);

			// Check LOP for June 2026 (month index 5).
			// June payroll cycle starts May 26 and ends June 25.
			// Should only include June 24 LOP.
			const juneLop = await leaveService.getMonthlyUsedDays('emp-cuid', 5, 2026, 'LOP');
			expect(juneLop).toBe(1.0);

			// Check LOP for July 2026 (month index 6).
			// July payroll cycle starts June 26 and ends July 25.
			// Should only include June 29 LOP.
			const julyLop = await leaveService.getMonthlyUsedDays('emp-cuid', 6, 2026, 'LOP');
			expect(julyLop).toBe(1.0);
		});

		it('should reject direct application for LOP leave type', async () => {
			vi.mocked(leaveDao.getLeaveTypeByCuid).mockResolvedValue(null);

			await expect(leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-lop',
				startDate: '2026-06-15',
				endDate: '2026-06-15',
				isHalfDay: false
			})).rejects.toThrow('Selected Leave Type is invalid or inactive.');
		});

		it('should consume Maternity Leave (ML) balance and not convert to LOP when employee is eligible', async () => {
			vi.clearAllMocks();

			// Female employee
			const femaleEmployee = { ...mockEmployee, gender: 'Female' };
			vi.mocked(db.employee.findUnique).mockResolvedValue(femaleEmployee as any);
			vi.mocked(db.employee.findFirst).mockResolvedValue(femaleEmployee as any);

			// Satisfies service days (>80 days, e.g. joined in 2025)
			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2025-01-01T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			// Mock ML balance is credited (e.g. 180 days remaining)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-ml') return { cuid: 'bal-ml', remaining_days: 180.0 } as any;
				return null;
			});

			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-ml-req' } as any);

			// Expected delivery date is in 10 weeks
			const edd = new Date('2026-09-01T00:00:00.000Z');
			const startDate = '2026-08-01'; // 4 weeks before EDD
			const endDate = '2026-08-14';   // 2 weeks request (14 days)

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-ml',
				startDate,
				endDate,
				isHalfDay: false,
				reason: 'Maternity Leave',
				expectedDeliveryDate: '2026-09-01',
				document: {
					fileName: 'certificate.pdf',
					mimeType: 'application/pdf',
					base64Data: Buffer.from('mock data').toString('base64')
				}
			});

			// Should create leave request consuming the primary balance completely
			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					days_from_primary: 14.0,
					days_from_lop: 0.0,
					days_from_lwp: 0.0
				})
			);
		});

		describe('Maternity Leave 8-Week Submission Validation', () => {
			beforeEach(() => {
				vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
				
				// Female employee
				const femaleEmployee = { ...mockEmployee, gender: 'Female' };
				vi.mocked(db.employee.findUnique).mockResolvedValue(femaleEmployee as any);
				vi.mocked(db.employee.findFirst).mockResolvedValue(femaleEmployee as any);

				// Satisfies service days (>80 days, e.g. joined in 2025)
				const testEmployment = {
					...mockEmployment,
					date_of_joining: new Date('2025-01-01T00:00:00.000Z')
				};
				vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

				// Mock ML balance is credited
				vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
					if (typeCuid === 'cuid-ml') return { cuid: 'bal-ml', remaining_days: 180.0 } as any;
					return null;
				});

				vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-ml-req' } as any);
			});

			it('Case 1: Should pass when expected delivery is 2026-07-01 and start date is 2026-03-01', async () => {
				await expect(leaveService.applyLeave('john@pieq.ai', {
					leaveTypeCuid: 'cuid-ml',
					startDate: '2026-03-01',
					endDate: '2026-03-14',
					isHalfDay: false,
					reason: 'Maternity Leave',
					expectedDeliveryDate: '2026-07-01',
					document: {
						fileName: 'certificate.pdf',
						mimeType: 'application/pdf',
						base64Data: Buffer.from('mock data').toString('base64')
					}
				})).resolves.toBeDefined();
			});

			it('Case 2: Should pass when expected delivery is 2026-07-01 and start date is 2026-04-01', async () => {
				await expect(leaveService.applyLeave('john@pieq.ai', {
					leaveTypeCuid: 'cuid-ml',
					startDate: '2026-04-01',
					endDate: '2026-04-14',
					isHalfDay: false,
					reason: 'Maternity Leave',
					expectedDeliveryDate: '2026-07-01',
					document: {
						fileName: 'certificate.pdf',
						mimeType: 'application/pdf',
						base64Data: Buffer.from('mock data').toString('base64')
					}
				})).resolves.toBeDefined();
			});

			it('Case 3: Should pass when expected delivery is 2026-07-01 and start date is 2026-05-05', async () => {
				await expect(leaveService.applyLeave('john@pieq.ai', {
					leaveTypeCuid: 'cuid-ml',
					startDate: '2026-05-05',
					endDate: '2026-05-14',
					isHalfDay: false,
					reason: 'Maternity Leave',
					expectedDeliveryDate: '2026-07-01',
					document: {
						fileName: 'certificate.pdf',
						mimeType: 'application/pdf',
						base64Data: Buffer.from('mock data').toString('base64')
					}
				})).resolves.toBeDefined();
			});

			it('Case 4: Should fail when expected delivery is 2026-07-01 and start date is 2026-06-05', async () => {
				await expect(leaveService.applyLeave('john@pieq.ai', {
					leaveTypeCuid: 'cuid-ml',
					startDate: '2026-06-05',
					endDate: '2026-06-14',
					isHalfDay: false,
					reason: 'Maternity Leave',
					expectedDeliveryDate: '2026-07-01',
					document: {
						fileName: 'certificate.pdf',
						mimeType: 'application/pdf',
						base64Data: Buffer.from('mock data').toString('base64')
					}
				})).rejects.toThrow('Maternity Leave request must be submitted at least 8 weeks before expected delivery.');
			});
		});

		it('should consume Paternity Leave (PL) balance and not convert to LOP when employee is eligible', async () => {
			vi.clearAllMocks();

			// Male employee
			const maleEmployee = { ...mockEmployee, gender: 'Male' };
			vi.mocked(db.employee.findUnique).mockResolvedValue(maleEmployee as any);
			vi.mocked(db.employee.findFirst).mockResolvedValue(maleEmployee as any);

			const testEmployment = {
				...mockEmployment,
				date_of_joining: new Date('2025-01-01T00:00:00.000Z')
			};
			vi.mocked(db.employment.findFirst).mockResolvedValue(testEmployment as any);

			// Mock PL balance is credited (5 days remaining)
			vi.mocked(leaveDao.getLeaveBalance).mockImplementation(async (_emp: any, typeCuid: any) => {
				if (typeCuid === 'cuid-pl') return { cuid: 'bal-pl', remaining_days: 5.0 } as any;
				return null;
			});

			vi.mocked(leaveDao.createLeaveRequest).mockResolvedValue({ cuid: 'new-pl-req' } as any);

			// Child birth date
			const childBirthDate = '2026-06-10';
			const startDate = '2026-06-15'; // within 1 month
			const endDate = '2026-06-17';   // 3 days request (Mon-Wed)

			await leaveService.applyLeave('john@pieq.ai', {
				leaveTypeCuid: 'cuid-pl',
				startDate,
				endDate,
				isHalfDay: false,
				reason: 'Paternity Leave',
				childBirthDate
			});

			// Should create leave request consuming the PL balance
			expect(leaveDao.createLeaveRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					days_from_primary: 3.0,
					days_from_lop: 0.0,
					days_from_lwp: 0.0
				})
			);
		});


	});
});

