import * as leaveDao from '$lib/server/dao/leave.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import { ValidationError } from '$lib/server/utils/errors.js';
import { calculateLeaveDays, isWeekend, isHoliday } from '$lib/server/config/leave.config.js';

export interface ApplyLeaveInput {
	leaveTypeCuid: string;
	startDate: string; // ISO string or YYYY-MM-DD
	endDate: string; // ISO string or YYYY-MM-DD
	isHalfDay: boolean;
	halfDaySession?: string | null;
	reason?: string | null;
	document?: {
		fileName: string;
		mimeType: string;
		base64Data: string;
	} | null;
	expectedDeliveryDate?: string | null;
	isMiscarriage?: boolean | null;
	childBirthDate?: string | null;
}

/**
 * Resolves an employee by official email (Employment) or personal email (Employee).
 * Falls back to the first employee in the database during local dev/testing.
 */
export async function resolveEmployee(email: string) {
	if (email) {
		const employment = await employeeDao.getActiveEmploymentByOfficialEmail(email);
		if (employment) {
			const employee = await employeeDao.getEmployeeByCuid(employment.employee_cuid);
			if (employee) {
				return { employee, employment };
			}
		}

		const employeeByPersonal = await employeeDao.getEmployeeByPersonalEmail(email);
		if (employeeByPersonal) {
			const employment = await leaveDao.getActiveEmploymentByEmployeeCuid(employeeByPersonal.cuid);
			return { employee: employeeByPersonal, employment: employment ?? null };
		}
	}

	// Fallback during local development if SSO is not configured or mapped
	const firstEmp = await employeeDao.getFirstEmployee();
	if (!firstEmp) {
		throw new Error('No employees found in the database. Please run seeding first.');
	}
	const firstEmployment = await leaveDao.getEmploymentByEmployeeCuid(firstEmp.cuid);
	return { employee: firstEmp, employment: firstEmployment };
}

/**
 * Dynamically computes and updates CL/SL monthly accruals.
 * Initializes other leave type balances for the employee for the given year if missing.
 */
function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

function calculateFractionalMonths(start: Date, end: Date): number {
	if (start > end) return 0;

	let totalMonths = 0;
	let current = new Date(start);

	while (current <= end) {
		const year = current.getFullYear();
		const month = current.getMonth();

		const startOfMonth = new Date(year, month, 1);
		const endOfMonth = new Date(year, month + 1, 0);

		const activeStart = current > startOfMonth ? current : startOfMonth;
		const activeEnd = end < endOfMonth ? end : endOfMonth;

		activeStart.setHours(0, 0, 0, 0);
		activeEnd.setHours(0, 0, 0, 0);

		const activeDays = Math.ceil((activeEnd.getTime() - activeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		const monthDays = getDaysInMonth(year, month);

		totalMonths += activeDays / monthDays;

		current = new Date(year, month + 1, 1);
	}

	return totalMonths;
}

let payrollCutoffDayValue = 25;

export async function getPayrollCutoffDay(tx?: any): Promise<number> {
	return payrollCutoffDayValue;
}

export function setPayrollCutoffDay(value: number) {
	payrollCutoffDayValue = value;
}

export async function getMonthlyUsedDays(employeeCuid: string, month: number, year: number, leaveCode: 'LOP' | 'LWP', tx?: any) {
	let cycleStart: Date;
	let cycleEnd: Date;

	if (leaveCode === 'LOP') {
		const cutoffDay = await getPayrollCutoffDay(tx);
		cycleStart = new Date(year, month - 1, cutoffDay + 1);
		cycleEnd = new Date(year, month, cutoffDay);
	} else {
		cycleStart = new Date(year, month, 1);
		cycleEnd = new Date(year, month + 1, 0);
	}

	const requests = await leaveDao.getApprovedRequestsInPeriod(employeeCuid, cycleStart, cycleEnd, tx);

	let total = 0;
	for (const req of requests) {
		const start = new Date(req.start_date);
		const end = new Date(req.end_date);
		const daysFromPrimary = req.days_from_primary ? Number(req.days_from_primary) : 0;
		const daysFromLwp = req.days_from_lwp ? Number(req.days_from_lwp) : 0;
		const daysFromLop = req.days_from_lop ? Number(req.days_from_lop) : 0;

		if (req.is_half_day) {
			const belongsToPeriod = leaveCode === 'LOP'
				? (start >= cycleStart && start <= cycleEnd)
				: (start.getMonth() === month && start.getFullYear() === year);

			if (belongsToPeriod) {
				if (leaveCode === 'LOP') {
					total += daysFromLop;
				} else if (leaveCode === 'LWP') {
					total += daysFromLwp;
				}
			}
			continue;
		}

		// Cache leaveType lookup outside the date loop to avoid N+1 queries
		const leaveType = await leaveDao.getLeaveTypeByCuid(req.leave_type_cuid, tx);
		const reqLeaveCode = leaveType?.leave_code || '';

		// Build list of working dates for this request
		const dates: Date[] = [];
		const curr = new Date(start);
		while (curr <= end) {
			dates.push(new Date(curr));
			curr.setDate(curr.getDate() + 1);
		}

		const activeDates: Date[] = [];
		for (const d of dates) {
			if (reqLeaveCode !== 'ML' && reqLeaveCode !== 'LWP') {
				if (isWeekend(d) || isHoliday(d)) {
					continue;
				}
			}
			activeDates.push(d);
		}

		// Map each active date to its type (primary / LWP / LOP) using the stored split counts.
		// Convention: primary days come first chronologically, then LWP days, then LOP days.
		for (let i = 0; i < activeDates.length; i++) {
			const d = activeDates[i];
			const belongsToPeriod = leaveCode === 'LOP'
				? (d >= cycleStart && d <= cycleEnd)
				: (d.getMonth() === month && d.getFullYear() === year);

			if (belongsToPeriod) {
				if (reqLeaveCode === 'LWP') {
					// Pure LWP request: every active day is a LWP day
					if (leaveCode === 'LWP') total += 1;
				} else if (reqLeaveCode === 'LOP') {
					// Pure LOP request: every active day is a LOP day
					if (leaveCode === 'LOP') total += 1;
				} else {
					// Split request: first daysFromPrimary are primary, then LWP, then LOP
					if (i < daysFromPrimary) {
						// Primary leave day — not counted for LOP or LWP
					} else if (i < daysFromPrimary + daysFromLwp) {
						if (leaveCode === 'LWP') total += 1;
					} else if (i < daysFromPrimary + daysFromLwp + daysFromLop) {
						if (leaveCode === 'LOP') total += 1;
					}
				}
			}
		}
	}

	return total;
}

export async function accrueLeaves(employeeCuid: string, year: number) {
	const activeTypes = await leaveDao.listLeaveTypes();
	const employee = await employeeDao.getEmployeeByCuid(employeeCuid);
	const employment = employee ? await leaveDao.getEmploymentByEmployeeCuid(employee.cuid) : null;

	if (!employee || !employment) return;

	const joinDate = employment.date_of_joining ? new Date(employment.date_of_joining) : new Date();
	joinDate.setHours(0, 0, 0, 0);
	const joinYear = joinDate.getFullYear();

	const relievingDate = employment.relieving_date ? new Date(employment.relieving_date) : null;
	if (relievingDate) {
		relievingDate.setHours(0, 0, 0, 0);
	}

	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const currentYear = now.getFullYear();

	const yearStart = new Date(year, 0, 1);
	const yearEnd = new Date(year, 11, 31);

	const serviceStart = joinDate > yearStart ? joinDate : yearStart;
	const serviceEnd = relievingDate && relievingDate < yearEnd ? relievingDate : yearEnd;

	let monthsAccrued = 0;
	if (serviceStart <= serviceEnd) {
		let effectiveEnd = serviceEnd;
		if (year === currentYear) {
			const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
			effectiveEnd = endOfCurrentMonth < serviceEnd ? endOfCurrentMonth : serviceEnd;
		} else if (year > currentYear) {
			effectiveEnd = serviceStart;
		}
		monthsAccrued = calculateFractionalMonths(serviceStart, effectiveEnd);
	}

	for (const type of activeTypes) {
		if (type.leave_code === 'LWP' || type.leave_code === 'LOP') {
			continue;
		}

		const policy = await leaveDao.getLeavePolicyByLeaveType(type.cuid);
		if (!policy) continue;

		if (employment.employment_type_cuid) {
			const mappings = await leaveDao.getLeavePolicyEmploymentTypes(policy.cuid);
			const isMapped = mappings.some((m: any) => m.employment_type_cuid === employment.employment_type_cuid);
			if (!isMapped && type.leave_code !== 'LWP') continue;
		}

		let initialAllocated = 0;
		if (type.leave_code === 'CL' || type.leave_code === 'SL') {
			initialAllocated = Math.min(6.0, monthsAccrued * 0.5);
		} else if (type.leave_code === 'EL') {
			const hasResignedThisYear = (relievingDate && relievingDate.getFullYear() === year) || employment.employment_status === 'resigned';
			if (hasResignedThisYear) {
				initialAllocated = 0.0;
			} else {
				const eligibleDate = new Date(joinDate);
				eligibleDate.setDate(eligibleDate.getDate() + policy.min_service_days);
				eligibleDate.setHours(0, 0, 0, 0);
				const elEligibleStart = eligibleDate > yearStart ? eligibleDate : yearStart;
				if (elEligibleStart <= serviceEnd) {
					const totalServiceMonths = calculateFractionalMonths(elEligibleStart, serviceEnd);
					initialAllocated = totalServiceMonths;
				}
			}
		} else if (type.leave_code === 'ML') {
			initialAllocated = employee.gender === 'Female' ? 168.0 : 0.0;
		} else if (type.leave_code === 'PL') {
			initialAllocated = employee.gender === 'Male' ? 5.0 : 0.0;
		}

		const existingBalance = await leaveDao.getLeaveBalance(employeeCuid, type.cuid, year);
		
		let carriedForward = 0.0;
		const maxCarryForward = Number(policy.max_carry_forward_days ?? 24);

		if (type.leave_code === 'EL' && year > joinYear) {
			const prevBalance = await leaveDao.getLeaveBalance(employeeCuid, type.cuid, year - 1);
			if (prevBalance) {
				const prevAllocated = Number(prevBalance.allocated_days) || 0.0;
				const prevCarried = Number(prevBalance.carried_forward_days) || 0.0;
				
				// Scoping check: prevBalance.used_days represents only the usage in year (year - 1).
				// It is reset yearly (scoped per calendar year) and is not a lifetime cumulative value.
				const prevUsed = Number(prevBalance.used_days) || 0.0;

				// EL Consumption Priority Rule:
				// Leave usage in the previous year (prevUsed) is deducted from that year's allocated_days (prevAllocated) first.
				const unusedAllocated = Math.max(0.0, prevAllocated - prevUsed);
				
				// Carry-Forward Cap:
				// Only the unused portion of the current year's allocated_days is eligible for carry-forward, subject to a maximum limit of 6 days.
				const cfFromAllocated = Math.min(6.0, unusedAllocated);

				// Carry-Forward Retained As-Is (No Cap):
				// If leave usage (prevUsed) exceeds the year's allocated_days, the excess usage (prevUsed - prevAllocated) is deducted from the previously carried-forward days (prevCarried).
				// Any unused previously carried-forward days are retained as-is, and carried forward to the new year without the 6-day limit.
				const unusedPreviousCarriedForward = Math.max(0.0, prevCarried - Math.max(0.0, prevUsed - prevAllocated));

				// The total carried forward balance for the new year is the sum of both components.
				carriedForward = Math.min(maxCarryForward, cfFromAllocated + unusedPreviousCarriedForward);
			}
		}

		if (!existingBalance) {
			let remaining = initialAllocated + carriedForward;
			if (type.leave_code === 'EL') {
				remaining = Math.min(maxCarryForward, remaining);
			}
			await leaveDao.createLeaveBalance({
				employee_cuid: employeeCuid,
				leave_type_cuid: type.cuid,
				year,
				allocated_days: initialAllocated,
				used_days: 0.0,
				remaining_days: remaining,
				carried_forward_days: carriedForward,
				created_by: 'system'
			});
		} else {
			const used = Number(existingBalance.used_days) || 0.0;
			let remaining = type.leave_code === 'EL'
				? Math.min(maxCarryForward, initialAllocated + carriedForward) - used
				: initialAllocated + carriedForward - used;
			remaining = Math.max(0.0, remaining);

			await leaveDao.updateLeaveBalance(existingBalance.cuid, {
				allocated_days: initialAllocated,
				carried_forward_days: carriedForward,
				remaining_days: remaining,
				updated_by: 'system'
			});
		}
	}
}

export async function getAvailableBalanceForMonth(
	employeeCuid: string,
	leaveTypeCuid: string,
	year: number,
	targetMonth: number,
	tx?: any
) {
	const leaveType = await leaveDao.getLeaveTypeByCuid(leaveTypeCuid, tx);
	if (!leaveType) {
		return 0;
	}

	const balanceRow = await leaveDao.getLeaveBalance(employeeCuid, leaveTypeCuid, year, tx);

	if (leaveType.leave_code !== 'CL' && leaveType.leave_code !== 'SL') {
		return balanceRow ? Number(balanceRow.remaining_days) : 0;
	}

	// Dynamic calculation for CL and SL
	const employment = await leaveDao.getEmploymentByEmployeeCuid(employeeCuid, tx);
	if (!employment) return 0;

	const joinDate = employment.date_of_joining ? new Date(employment.date_of_joining) : new Date();
	joinDate.setHours(0, 0, 0, 0);

	const relievingDate = employment.relieving_date ? new Date(employment.relieving_date) : null;
	if (relievingDate) {
		relievingDate.setHours(0, 0, 0, 0);
	}

	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const currentYear = now.getFullYear();

	const yearStart = new Date(year, 0, 1);

	let effectiveMonthLimit = targetMonth;
	if (year === currentYear) {
		effectiveMonthLimit = Math.min(targetMonth, now.getMonth());
	} else if (year > currentYear) {
		effectiveMonthLimit = -1;
	}

	let accrued = 0;
	if (effectiveMonthLimit >= 0) {
		const serviceStart = joinDate > yearStart ? joinDate : yearStart;
		const accrualEnd = new Date(year, effectiveMonthLimit + 1, 0);
		const serviceEnd = relievingDate && relievingDate < accrualEnd ? relievingDate : accrualEnd;

		if (serviceStart <= serviceEnd) {
			const monthsAccrued = calculateFractionalMonths(serviceStart, serviceEnd);
			accrued = Math.min(6.0, monthsAccrued * 0.5);
		}
	}

	const carriedForward = balanceRow ? (Number(balanceRow.carried_forward_days) || 0.0) : 0.0;
	const totalAccrued = accrued + carriedForward;

	// Sum actual CL/SL days deducted from balance up to targetMonth
	const approvedRequests = await leaveDao.getApprovedRequestsInMonthRange(
		employeeCuid,
		leaveTypeCuid,
		new Date(year, 0, 1),
		new Date(year, targetMonth + 1, 0),
		tx
	);

	const usedUpToMonth = approvedRequests.reduce(
		(sum: number, req: any) => sum + (req.days_from_primary ? Number(req.days_from_primary) : 0),
		0
	);

	return Math.max(0.0, totalAccrued - usedUpToMonth);
}

export async function getEmployeeLeaveDetails(email: string, year: number) {
	const { employee, employment } = await resolveEmployee(email);
	if (!employee) {
		throw new Error('Employee record not found.');
	}

	// Make sure leave balances exist and are updated
	await accrueLeaves(employee.cuid, year);

	const balances = await leaveDao.getLeaveBalances(employee.cuid, year);
	const requests = await leaveDao.getLeaveRequests(employee.cuid);
	const activeTypes = await leaveDao.listLeaveTypes();
	const activePolicies = await leaveDao.listLeavePolicies();

	// Dynamically calculate and append monthly LOP and LWP balances
	const now = new Date();
	const targetMonth = year === now.getFullYear() ? now.getMonth() : (year < now.getFullYear() ? 11 : 0);
	const targetYear = year;

	// Join types and request categories, filtering out LOP/LWP database rows
	const filteredBalances = balances.filter((b: any) => {
		const type = activeTypes.find((t: any) => t.cuid === b.leave_type_cuid);
		return type?.leave_code !== 'LOP' && type?.leave_code !== 'LWP';
	});

	const joinedBalances = [];
	for (const b of filteredBalances) {
		const type = activeTypes.find((t: any) => t.cuid === b.leave_type_cuid);
		const leaveCode = type?.leave_code ?? 'N/A';

		let allocated = Number(b.allocated_days) || 0.0;
		let used = Number(b.used_days) || 0.0;
		let remaining = Number(b.remaining_days) || 0.0;

		if (leaveCode === 'CL' || leaveCode === 'SL') {
			remaining = await getAvailableBalanceForMonth(employee.cuid, b.leave_type_cuid, targetYear, targetMonth);
			
			// Recalculate allocated (accrued) days up to targetMonth
			const joinDate = employment?.date_of_joining ? new Date(employment.date_of_joining) : new Date();
			joinDate.setHours(0, 0, 0, 0);
			const yearStart = new Date(targetYear, 0, 1);

			let effectiveMonthLimit = targetMonth;
			if (targetYear === now.getFullYear()) {
				effectiveMonthLimit = Math.min(targetMonth, now.getMonth());
			} else if (targetYear > now.getFullYear()) {
				effectiveMonthLimit = -1;
			}

			let accrued = 0;
			if (effectiveMonthLimit >= 0) {
				const serviceStart = joinDate > yearStart ? joinDate : yearStart;
				const accrualEnd = new Date(targetYear, effectiveMonthLimit + 1, 0);
				const serviceEnd = employment?.relieving_date && new Date(employment.relieving_date) < accrualEnd ? new Date(employment.relieving_date) : accrualEnd;
				if (serviceStart <= serviceEnd) {
					const monthsAccrued = calculateFractionalMonths(serviceStart, serviceEnd);
					accrued = Math.min(6.0, monthsAccrued * 0.5);
				}
			}
			const carriedForward = Number(b.carried_forward_days) || 0.0;
			allocated = accrued + carriedForward;

			// used up to targetMonth
			const approvedRequests = await leaveDao.getApprovedRequestsInMonthRange(
				employee.cuid,
				b.leave_type_cuid,
				new Date(targetYear, 0, 1),
				new Date(targetYear, targetMonth + 1, 0)
			);
			used = approvedRequests.reduce(
				(sum: number, req: any) => sum + (req.days_from_primary ? Number(req.days_from_primary) : 0),
				0
			);
		}

		joinedBalances.push({
			cuid: b.cuid,
			leave_type_cuid: b.leave_type_cuid,
			leave_name: type?.leave_name ?? 'Unknown',
			leave_code: leaveCode,
			allocated_days: allocated,
			used_days: used,
			remaining_days: remaining,
			carried_forward_days: Number(b.carried_forward_days) || 0.0
		});
	}

	const lopUsed = await getMonthlyUsedDays(employee.cuid, targetMonth, targetYear, 'LOP');
	const lwpUsed = await getMonthlyUsedDays(employee.cuid, targetMonth, targetYear, 'LWP');

	const lopType = activeTypes.find((t: any) => t.leave_code === 'LOP');
	const lwpType = activeTypes.find((t: any) => t.leave_code === 'LWP');

	if (lopType) {
		joinedBalances.push({
			cuid: `mock-lop-${employee.cuid}`,
			leave_type_cuid: lopType.cuid,
			leave_name: lopType.leave_name,
			leave_code: 'LOP',
			allocated_days: 0.0,
			used_days: lopUsed,
			remaining_days: 0.0,
			carried_forward_days: 0.0
		});
	}

	if (lwpType) {
		const lwpPolicy = activePolicies.find((p: any) => p.leave_type_cuid === lwpType.cuid);
		const lwpAllocated = lwpPolicy ? Number(lwpPolicy.annual_limit) : 365.0;
		joinedBalances.push({
			cuid: `mock-lwp-${employee.cuid}`,
			leave_type_cuid: lwpType.cuid,
			leave_name: lwpType.leave_name,
			leave_code: 'LWP',
			allocated_days: lwpAllocated,
			used_days: lwpUsed,
			remaining_days: Math.max(0.0, lwpAllocated - lwpUsed),
			carried_forward_days: 0.0
		});
	}

	const joinedRequests = requests.map((r: any) => {
		const type = activeTypes.find((t: any) => t.cuid === r.leave_type_cuid);
		return {
			cuid: r.cuid,
			leave_name: type?.leave_name ?? 'Unknown',
			leave_code: type?.leave_code ?? 'N/A',
			start_date: r.start_date,
			end_date: r.end_date,
			total_days: Number(r.total_days),
			is_half_day: r.is_half_day,
			half_day_session: r.half_day_session,
			reason: r.reason,
			document_url: r.file_name ? `/api/leaves/${r.cuid}/document` : null,
			file_name: r.file_name,
			mime_type: r.mime_type,
			file_size: r.file_size,
			request_status: r.request_status,
			days_from_primary: r.days_from_primary ? Number(r.days_from_primary) : 0,
			days_from_lwp: r.days_from_lwp ? Number(r.days_from_lwp) : 0,
			days_from_lop: r.days_from_lop ? Number(r.days_from_lop) : 0,
			created_at: r.created_at
		};
	});

	const joinedLeaveTypes = activeTypes.map((t: any) => {
		const p = activePolicies.find((x: any) => x.leave_type_cuid === t.cuid);
		return {
			cuid: t.cuid,
			leave_name: t.leave_name,
			leave_code: t.leave_code,
			is_paid: t.is_paid,
			requires_approval: t.requires_approval,
			policy: p ? {
				cuid: p.cuid,
				annual_limit: Number(p.annual_limit),
				max_per_month: p.max_per_month ? Number(p.max_per_month) : null,
				carry_forward_allowed: p.carry_forward_allowed,
				max_carry_forward_days: p.max_carry_forward_days ? Number(p.max_carry_forward_days) : null,
				document_required: p.document_required,
				document_required_after_days: p.document_required_after_days,
				min_service_days: p.min_service_days,
				allow_half_day: p.allow_half_day,
				gender_specific: p.gender_specific,
				applicable_gender: p.applicable_gender
			} : null
		};
	});

	const subordinates = await leaveDao.getSubordinates(employee.cuid);
	const isManager = subordinates.length > 0;
	let pendingApprovals: any[] = [];
	if (isManager) {
		pendingApprovals = await getPendingApprovalsForManager(employee.cuid);
	}

	const payrollCutoffDay = await getPayrollCutoffDay();

	return {
		employee: {
			cuid: employee.cuid,
			emp_code: employee.emp_code,
			first_name: employee.first_name,
			last_name: employee.last_name,
			gender: employee.gender,
			date_of_joining: employment?.date_of_joining ?? null,
			relieving_date: employment?.relieving_date ?? null
		},
		balances: joinedBalances,
		requests: joinedRequests,
		leaveTypes: joinedLeaveTypes,
		isManager,
		pendingApprovals,
		payrollCutoffDay
	};
}

export async function getPendingApprovalsForManager(managerEmployeeCuid: string) {
	const subordinates = await leaveDao.getSubordinates(managerEmployeeCuid);
	const subordinateCuids = subordinates.map((e: any) => e.employee_cuid);
	if (subordinateCuids.length === 0) return [];

	const requests = await leaveDao.getLeaveRequestsForEmployees(subordinateCuids);

	const activeTypes = await leaveDao.listLeaveTypes();
	const activeEmployees = await employeeDao.getEmployeesByCuids(subordinateCuids);

	return requests.map((r: any) => {
		const emp = activeEmployees.find((e: any) => e.cuid === r.employee_cuid);
		const type = activeTypes.find((t: any) => t.cuid === r.leave_type_cuid);
		return {
			cuid: r.cuid,
			employee_cuid: r.employee_cuid,
			employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown Employee',
			employee_code: emp?.emp_code ?? 'N/A',
			leave_name: type?.leave_name ?? 'Unknown',
			leave_code: type?.leave_code ?? 'N/A',
			start_date: r.start_date,
			end_date: r.end_date,
			total_days: Number(r.total_days),
			is_half_day: r.is_half_day,
			half_day_session: r.half_day_session,
			reason: r.reason,
			document_url: r.file_name ? `/api/leaves/${r.cuid}/document` : null,
			file_name: r.file_name,
			mime_type: r.mime_type,
			file_size: r.file_size,
			request_status: r.request_status,
			days_from_primary: r.days_from_primary ? Number(r.days_from_primary) : 0,
			days_from_lwp: r.days_from_lwp ? Number(r.days_from_lwp) : 0,
			days_from_lop: r.days_from_lop ? Number(r.days_from_lop) : 0,
			created_at: r.created_at
		};
	});
}

export async function applyLeave(email: string, input: ApplyLeaveInput) {
	const { employee, employment } = await resolveEmployee(email);
	if (!employee) {
		throw new Error('Employee record not found.');
	}

	const leaveType = await leaveDao.getLeaveTypeByCuid(input.leaveTypeCuid);
	if (!leaveType) {
		throw new ValidationError('leaveTypeCuid', 'Selected Leave Type is invalid or inactive.');
	}

	const policy = await leaveDao.getLeavePolicyByLeaveType(leaveType.cuid);
	if (!policy) {
		throw new ValidationError('leaveTypeCuid', 'No active Leave Policy found for this leave type.');
	}

	// 1. Employment Type Mapping validation
	if (employment?.employment_type_cuid) {
		const mappings = await leaveDao.getLeavePolicyEmploymentTypes(policy.cuid);
		const isMapped = mappings.some((m: any) => m.employment_type_cuid === employment.employment_type_cuid);
		if (!isMapped && leaveType.leave_code !== 'LWP') {
			throw new ValidationError('leaveTypeCuid', 'This leave type is not applicable to your employment type.');
		}
	}

	// 2. Gender Specific validation
	if (policy.gender_specific) {
		const empGender = (employee.gender ?? '').toLowerCase();
		const appGender = (policy.applicable_gender ?? '').toLowerCase();
		if (empGender !== appGender) {
			throw new ValidationError('leaveTypeCuid', `This leave type is only applicable to ${policy.applicable_gender} employees.`);
		}
	}

	// 3. Service Days validation
	const startDate = new Date(input.startDate);
	const endDate = new Date(input.endDate);

	if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
		throw new ValidationError('startDate', 'Invalid start or end date format.');
	}

	if (startDate > endDate) {
		throw new ValidationError('startDate', 'Start Date cannot exceed End Date.');
	}

	const joinDate = employment?.date_of_joining ? new Date(employment.date_of_joining) : new Date();
	joinDate.setHours(0, 0, 0, 0);
	const serviceTimeDiff = startDate.getTime() - joinDate.getTime();
	const serviceDays = serviceTimeDiff / (1000 * 60 * 60 * 24);

	if (serviceDays < policy.min_service_days) {
		throw new ValidationError('leaveTypeCuid', `Minimum service of ${policy.min_service_days} days is required for this leave type. You have ${Math.max(0, Math.floor(serviceDays))} days.`);
	}

	// 4. Half-day validation
	if (input.isHalfDay) {
		if (!policy.allow_half_day) {
			throw new ValidationError('isHalfDay', 'Half-day leaves are not allowed for this leave type.');
		}
		if (!input.halfDaySession || !['FN', 'AN'].includes(input.halfDaySession)) {
			throw new ValidationError('halfDaySession', 'Half-day session (FN/AN) is required.');
		}
	}

	// Calculate requested days
	const totalDays = input.isHalfDay
		? 0.5
		: calculateLeaveDays(startDate, endDate, leaveType.leave_code);

	if (totalDays === 0) {
		throw new ValidationError('startDate', 'Requested leave period contains only holidays or weekends and counts as 0 days.');
	}

	// 5. Overlapping validation
	const overlaps = await leaveDao.getOverlappingRequests(employee.cuid, startDate, endDate);
	if (overlaps.length > 0) {
		let isOverlapping = false;
		for (const o of overlaps) {
			if (input.isHalfDay && o.is_half_day) {
				const oStart = new Date(o.start_date);
				if (oStart.toDateString() === startDate.toDateString() && o.half_day_session === input.halfDaySession) {
					isOverlapping = true;
					break;
				}
			} else {
				isOverlapping = true;
				break;
			}
		}

		if (isOverlapping) {
			throw new ValidationError('startDate', 'You have an overlapping leave request during this period.');
		}
	}

	// Fetch existing requests for CL contiguous validations
	const existingRequests = await leaveDao.getLeaveRequests(employee.cuid);
	const activeRequests = existingRequests.filter((r: any) => r.request_status === 'pending' || r.request_status === 'approved');

	const relievingDate = employment?.relieving_date ? new Date(employment.relieving_date) : null;
	if (relievingDate) {
		relievingDate.setHours(0, 0, 0, 0);
	}

	// CL/SL month validations
	if (leaveType.leave_code === 'CL' || leaveType.leave_code === 'SL') {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();

		const startYear = startDate.getFullYear();
		const startMonth = startDate.getMonth();
		const endYear = endDate.getFullYear();
		const endMonth = endDate.getMonth();

		const isStartFuture = startYear > currentYear || (startYear === currentYear && startMonth > currentMonth);
		const isEndFuture = endYear > currentYear || (endYear === currentYear && endMonth > currentMonth);
		if (isStartFuture || isEndFuture) {
			throw new ValidationError('startDate', 'Casual Leave (CL) and Sick Leave (SL) cannot be applied for future months.');
		}

		if (startYear !== endYear || startMonth !== endMonth) {
			throw new ValidationError('endDate', 'Casual Leave (CL) and Sick Leave (SL) requests cannot span multiple months.');
		}
	}

	// CL specific validations
	if (leaveType.leave_code === 'CL') {
		if (totalDays > 2) {
			throw new ValidationError('leaveTypeCuid', 'Maximum 2 days can be applied in a single Casual Leave request. For longer leaves, please apply using Sick Leave (SL) or Earned Leave (EL) instead.');
		}
	}

	// EL specific validations
	if (leaveType.leave_code === 'EL') {
		if (totalDays > 24) {
			throw new ValidationError('endDate', 'A single Earned Leave (EL) request must not exceed 24 days.');
		}
	}

	// Check contiguous combination of CL with EL/SL
	for (const r of activeRequests) {
		const rType = await leaveDao.getLeaveTypeByCuid(r.leave_type_cuid);
		if (!rType) continue;

		const isCL = leaveType.leave_code === 'CL';
		const isOtherCLConflict = ['EL', 'SL'].includes(rType.leave_code);
		const isNewOtherConflict = ['EL', 'SL'].includes(leaveType.leave_code);
		const isOldCL = rType.leave_code === 'CL';

		if ((isCL && isOtherCLConflict) || (isNewOtherConflict && isOldCL)) {
			const range1 = startDate < r.start_date ? { start: startDate, end: endDate } : { start: new Date(r.start_date), end: new Date(r.end_date) };
			const range2 = startDate < r.start_date ? { start: new Date(r.start_date), end: new Date(r.end_date) } : { start: startDate, end: endDate };

			const checkStart = new Date(range1.end);
			checkStart.setDate(checkStart.getDate() + 1);
			const checkEnd = new Date(range2.start);
			checkEnd.setDate(checkEnd.getDate() - 1);

			let workingDaysBetween = 0;
			const temp = new Date(checkStart);
			while (temp <= checkEnd) {
				if (!isWeekend(temp) && !isHoliday(temp)) {
					workingDaysBetween++;
				}
				temp.setDate(temp.getDate() + 1);
			}

			if (workingDaysBetween === 0) {
				throw new ValidationError('startDate', 'Casual Leave cannot be combined or appended with Earned Leave (EL) or Sick Leave (SL) in a continuous leave period.');
			}
		}
	}

	// ML specific validations
	if (leaveType.leave_code === 'ML') {
		if (employee.gender !== 'Female') {
			throw new ValidationError('leaveTypeCuid', 'Maternity Leave is only applicable to Female employees.');
		}
		if (!input.expectedDeliveryDate) {
			throw new ValidationError('expectedDeliveryDate', 'Expected Delivery Date is required for Maternity Leave.');
		}
		const edd = new Date(input.expectedDeliveryDate);
		if (isNaN(edd.getTime())) {
			throw new ValidationError('expectedDeliveryDate', 'Invalid Expected Delivery Date format.');
		}

		// worked >= 80 days during previous 12 months before expected delivery
		const eddStart = new Date(edd);
		eddStart.setFullYear(eddStart.getFullYear() - 1);
		const serviceStart = joinDate > eddStart ? joinDate : eddStart;
		const serviceEnd = relievingDate && relievingDate < edd ? relievingDate : edd;

		let activeServiceDays = 0;
		if (serviceStart <= serviceEnd) {
			activeServiceDays = Math.ceil((serviceEnd.getTime() - serviceStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		}
		if (activeServiceDays < 80) {
			throw new ValidationError('leaveTypeCuid', `Employee must have worked at least 80 days during the previous 12 months before expected delivery. Current service in period: ${activeServiceDays} days.`);
		}

		// Leave cannot begin earlier than 8 weeks before expected delivery
		const minStartDate = new Date(edd);
		minStartDate.setDate(minStartDate.getDate() - 56);
		if (startDate < minStartDate) {
			throw new ValidationError('startDate', 'Maternity Leave cannot begin earlier than 8 weeks before expected delivery.');
		}

		// Miscarriage/MTP paid leave limit is 4 weeks, normal ML limit is 24 weeks
		const maxAllowedML = input.isMiscarriage ? 28.0 : 168.0;
		if (totalDays > maxAllowedML) {
			throw new ValidationError('endDate', `Maternity Leave is limited to a maximum of ${maxAllowedML === 28.0 ? '4 weeks (28 days)' : '24 weeks (168 days)'} for this request.`);
		}

		// Must be submitted at least 8 weeks before expected delivery (except miscarriage)
		if (!input.isMiscarriage) {
			const now = new Date();
			now.setHours(0, 0, 0, 0);
			const minEdd = new Date(now);
			minEdd.setDate(minEdd.getDate() + 56);
			if (edd < minEdd) {
				throw new ValidationError('expectedDeliveryDate', 'Maternity Leave request must be submitted at least 8 weeks before expected delivery.');
			}
		}

		// Medical certificate is mandatory
		if (!input.document) {
			throw new ValidationError('documentUrl', 'A supporting medical certificate is mandatory for Maternity Leave.');
		}
	}

	// PL specific validations
	if (leaveType.leave_code === 'PL') {
		if (employee.gender !== 'Male') {
			throw new ValidationError('leaveTypeCuid', 'Paternity Leave is only applicable to Male employees.');
		}
		if (!input.childBirthDate) {
			throw new ValidationError('childBirthDate', "Child's Birth Date is required for Paternity Leave.");
		}
		const birthDate = new Date(input.childBirthDate);
		if (isNaN(birthDate.getTime())) {
			throw new ValidationError('childBirthDate', 'Invalid Birth Date format.');
		}

		if (totalDays > 5) {
			throw new ValidationError('endDate', 'Paternity Leave is limited to a maximum of 5 days.');
		}

		const maxEndDate = new Date(birthDate);
		maxEndDate.setDate(maxEndDate.getDate() + 30);
		if (startDate < birthDate || endDate > maxEndDate) {
			throw new ValidationError('startDate', 'Paternity Leave must be availed within 1 month of the child\'s birth.');
		}

		const existingPL = activeRequests.some((r: any) => r.leave_type_cuid === leaveType.cuid);
		if (existingPL) {
			throw new ValidationError('leaveTypeCuid', 'Paternity Leave is a one-time entitlement per childbirth and has already been applied for or approved.');
		}
	}

	// 6. Leave Balance and LOP Split calculations
	// Rule: For LWP requests, all days are explicitly LWP.
	// For ALL other leave types (CL, SL, EL, ML, PL ...), any days that exceed the
	// available balance are automatically treated as Loss of Pay (LOP), never as LWP.
	const targetYear = startDate.getFullYear();
	await accrueLeaves(employee.cuid, targetYear);
	const balance = await leaveDao.getLeaveBalance(employee.cuid, leaveType.cuid, targetYear);

	let daysFromPrimary = totalDays;
	let daysFromLwp = 0;
	let daysFromLop = 0;

	if (leaveType.leave_code === 'LWP') {
		// Explicit LWP request: employee chose to apply LWP directly
		daysFromPrimary = 0.0;
		daysFromLwp = totalDays;
	} else {
		// All other leave types: available balance first, excess → LOP
		let remainingBalance: number;
		if (leaveType.leave_code === 'CL' || leaveType.leave_code === 'SL') {
			const targetMonth = startDate.getMonth();
			remainingBalance = await getAvailableBalanceForMonth(employee.cuid, leaveType.cuid, targetYear, targetMonth);
		} else {
			remainingBalance = balance ? Number(balance.remaining_days) : 0;
		}

		if (totalDays > remainingBalance) {
			daysFromPrimary = Math.max(0, remainingBalance);
			daysFromLop = totalDays - daysFromPrimary;
		}
	}

	// Monthly LWP cap check — only applies when the employee explicitly applies for LWP
	if (leaveType.leave_code === 'LWP' && daysFromLwp > 0) {
		const lwpType = await leaveDao.getLeaveTypeByCode('LWP');
		if (!lwpType) {
			throw new Error('LWP Leave Type not configured.');
		}
		const lwpPolicy = await leaveDao.getLeavePolicyByLeaveType(lwpType.cuid);
		const lwpAllocated = lwpPolicy ? Number(lwpPolicy.annual_limit) : 365.0;

		const targetMonth = startDate.getMonth();
		const targetYearForLwp = startDate.getFullYear();

		const lwpUsed = await getMonthlyUsedDays(employee.cuid, targetMonth, targetYearForLwp, 'LWP');
		const lwpRemaining = Math.max(0.0, lwpAllocated - lwpUsed);

		if (daysFromLwp > lwpRemaining) {
			throw new ValidationError('leaveTypeCuid', `Requested leave exceeds available balance. You can only take ${lwpRemaining} LWP day(s) this month (${daysFromLwp - lwpRemaining} day(s) would exceed the monthly cap).`);
		}
	}

	// 7. Document Required validation
	if (leaveType.leave_code !== 'ML' && policy.document_required) {
		const reqAfter = policy.document_required_after_days ?? 0;
		if (totalDays >= reqAfter && !input.document) {
			throw new ValidationError('documentUrl', 'A supporting document is required for leave requests of ' + reqAfter + ' days or more.');
		}
	}

	// Serialize ML/PL metadata into reason
	let finalReason = input.reason || '';
	if (leaveType.leave_code === 'ML') {
		finalReason = `[Expected Delivery: ${input.expectedDeliveryDate}]${input.isMiscarriage ? ' [Miscarriage/MTP]' : ''} ${finalReason}`;
	} else if (leaveType.leave_code === 'PL') {
		finalReason = `[Child Birth Date: ${input.childBirthDate}] ${finalReason}`;
	}

	// Decode base64 to Buffer
	let file_name: string | null = null;
	let mime_type: string | null = null;
	let file_size: number | null = null;
	let document_data: Buffer | null = null;

	if (input.document) {
		file_name = input.document.fileName;
		mime_type = input.document.mimeType;
		document_data = Buffer.from(input.document.base64Data, 'base64');
		file_size = document_data.length;

		const maxSizeBytes = 2 * 1024 * 1024;
		if (file_size > maxSizeBytes) {
			throw new ValidationError('documentUrl', 'Uploaded document must be less than or equal to 2 MB.');
		}
	}

	// Create request
	return leaveDao.createLeaveRequest({
		employee_cuid: employee.cuid,
		leave_type_cuid: leaveType.cuid,
		start_date: startDate,
		end_date: endDate,
		total_days: totalDays,
		is_half_day: input.isHalfDay,
		half_day_session: input.isHalfDay ? input.halfDaySession : null,
		reason: finalReason,
		file_name,
		mime_type,
		file_size,
		document_data,
		request_status: 'pending',
		days_from_primary: daysFromPrimary,
		days_from_lwp: daysFromLwp,
		days_from_lop: daysFromLop,
		created_by: employee.emp_code
	});
}

export async function withdrawLeave(email: string, requestCuid: string) {
	const { employee } = await resolveEmployee(email);
	if (!employee) {
		throw new Error('Employee record not found.');
	}

	const request = await leaveDao.getLeaveRequestByCuid(requestCuid);
	if (!request) {
		throw new Error('Leave request not found.');
	}

	if (request.employee_cuid !== employee.cuid) {
		throw new Error('Unauthorized: You can only withdraw your own leave requests.');
	}

	if (request.request_status !== 'pending') {
		throw new Error('Only pending leave requests can be withdrawn.');
	}

	return leaveDao.updateLeaveRequest(requestCuid, {
		request_status: 'withdrawn',
		withdrawn_at: new Date(),
		updated_by: employee.emp_code
	});
}

/**
 * Service function to approve a leave request (backend support ready for future workflow).
 * Updates leave balances and writes to attendance_records.
 */
export async function approveLeaveRequest(requestCuid: string, approverUserCuid: string) {
	return leaveDao.runTransaction(async (tx) => {
		const request = await leaveDao.getLeaveRequestByCuid(requestCuid, tx);

		if (!request) {
			throw new Error('Leave request not found.');
		}

		if (request.request_status !== 'pending') {
			throw new Error('Leave request is not in pending status.');
		}

		const leaveType = await leaveDao.getLeaveTypeByCuid(request.leave_type_cuid, tx);

		if (!leaveType) {
			throw new Error('Leave type not found.');
		}

		// Verify subordinate relationship
		const targetEmployment = await leaveDao.getEmploymentByEmployeeCuid(request.employee_cuid, tx);
		let approver = await employeeDao.getEmployeeByCuid(approverUserCuid, tx);
		if (!approver) {
			approver = await employeeDao.getEmployeeByEmpCode(approverUserCuid, tx);
		}
		if (!approver) {
			throw new Error('Approver employee record not found.');
		}
		if (!targetEmployment || targetEmployment.reporting_manager_cuid !== approver.cuid) {
			throw new Error('Unauthorized: You can only approve/reject requests from your direct reports.');
		}

		// Validate all leave rules already implemented
		const employee = await employeeDao.getEmployeeByCuid(request.employee_cuid, tx);
		if (!employee) {
			throw new Error('Employee record not found.');
		}

		const policy = await leaveDao.getLeavePolicyByLeaveType(request.leave_type_cuid, tx);

		if (policy) {
			// Gender check
			if (policy.gender_specific && employee.gender && policy.applicable_gender) {
				if (employee.gender.toLowerCase() !== policy.applicable_gender.toLowerCase()) {
					throw new Error(`Employee gender ${employee.gender} does not match policy requirements.`);
				}
			}
			// Service days check
			const joinDate = targetEmployment?.date_of_joining ? new Date(targetEmployment.date_of_joining) : new Date();
			const serviceDays = (request.start_date.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
			if (serviceDays < policy.min_service_days) {
				throw new Error('Employee does not meet the minimum service days required for this leave type.');
			}
		}

		// Recheck leave balance sufficiency
		const year = request.start_date.getFullYear();
		if (request.days_from_primary && Number(request.days_from_primary) > 0) {
			let remainingBalance: number;
			if (leaveType.leave_code === 'CL' || leaveType.leave_code === 'SL') {
				const targetMonth = request.start_date.getMonth();
				remainingBalance = await getAvailableBalanceForMonth(request.employee_cuid, request.leave_type_cuid, year, targetMonth, tx);
			} else {
				const primaryBalance = await leaveDao.getLeaveBalance(request.employee_cuid, request.leave_type_cuid, year, tx);
				remainingBalance = primaryBalance ? Number(primaryBalance.remaining_days) : 0;
			}

			if (remainingBalance < Number(request.days_from_primary)) {
				throw new Error(`Insufficient leave balance. Available: ${remainingBalance} days. Required: ${Number(request.days_from_primary)} days.`);
			}
		}

		if (request.days_from_lwp && Number(request.days_from_lwp) > 0) {
			const lwpType = await leaveDao.getLeaveTypeByCode('LWP', tx);
			if (!lwpType) {
				throw new Error('LWP Leave Type not configured.');
			}
			const lwpPolicy = await leaveDao.getLeavePolicyByLeaveType(lwpType.cuid, tx);
			const lwpAllocated = lwpPolicy ? Number(lwpPolicy.annual_limit) : 365.0;

			const targetMonth = request.start_date.getMonth();
			const targetYearForLwp = request.start_date.getFullYear();

			const lwpUsed = await getMonthlyUsedDays(request.employee_cuid, targetMonth, targetYearForLwp, 'LWP', tx);
			const lwpRemaining = Math.max(0.0, lwpAllocated - lwpUsed);

			if (lwpRemaining < Number(request.days_from_lwp)) {
				throw new Error(`Insufficient LWP balance. Available: ${lwpRemaining} days. Required: ${Number(request.days_from_lwp)} days.`);
			}
		}

		// 1. Update status
		const updatedRequest = await leaveDao.updateLeaveRequest(requestCuid, {
			request_status: 'approved',
			approved_by: approverUserCuid,
			approved_at: new Date(),
			updated_by: approverUserCuid
		}, tx);

		// 2. Deduct leave balance
		if (request.days_from_primary && Number(request.days_from_primary) > 0) {
			const primaryBalance = await leaveDao.getLeaveBalance(request.employee_cuid, request.leave_type_cuid, year, tx);
			if (primaryBalance) {
				await leaveDao.updateLeaveBalance(primaryBalance.cuid, {
					used_days: { increment: request.days_from_primary },
					remaining_days: { decrement: request.days_from_primary }
				}, tx);
			}
		}

		// 3. Create/update Attendance Records
		const start = new Date(request.start_date);
		const end = new Date(request.end_date);
		const dates: Date[] = [];
		const current = new Date(start);

		while (current <= end) {
			dates.push(new Date(current));
			current.setDate(current.getDate() + 1);
		}

		const attendanceStatus = request.is_half_day ? 'HalfDay' : 'Absent';

		// Build split remark suffix if this request contains LOP or LWP split days
		const lopDays = request.days_from_lop ? Number(request.days_from_lop) : 0;
		const lwpSplitDays = request.days_from_lwp ? Number(request.days_from_lwp) : 0;
		let splitSuffix = '';
		if (lopDays > 0) splitSuffix = ` (incl. ${lopDays} LOP day${lopDays !== 1 ? 's' : ''})`;
		else if (lwpSplitDays > 0 && leaveType.leave_code !== 'LWP') splitSuffix = ` (incl. ${lwpSplitDays} LWP day${lwpSplitDays !== 1 ? 's' : ''})`;
		const attendanceRemark = `Approved Leave: ${leaveType.leave_name}${splitSuffix}`;

		for (const d of dates) {
			const code = leaveType.leave_code.toUpperCase();
			if (code !== 'ML' && code !== 'LWP') {
				if (isWeekend(d) || isHoliday(d)) {
					continue;
				}
			}

			const existing = await leaveDao.getAttendanceRecord(request.employee_cuid, d, tx);

			if (existing) {
				const status = existing.attendance_status;
				if (['Present', 'Holiday', 'WFH'].includes(status)) {
					throw new ValidationError('attendance', `Cannot approve leave. Attendance record for date ${d.toLocaleDateString('en-GB')} already exists with status '${status}'.`);
				}
			}

			await leaveDao.upsertAttendanceRecord({
				employee_cuid: request.employee_cuid,
				attendance_date: d,
				attendance_status: attendanceStatus,
				remarks: attendanceRemark,
				created_by: approverUserCuid
			}, tx);
		}

		return updatedRequest;
	});
}

export async function getLeaveRequestByCuid(cuid: string) {
	return leaveDao.getLeaveRequestByCuid(cuid);
}

export async function rejectLeaveRequest(requestCuid: string, rejectorUserCuid: string) {
	const request = await leaveDao.getLeaveRequestByCuid(requestCuid);
	if (!request) {
		throw new Error('Leave request not found.');
	}

	if (request.request_status !== 'pending') {
		throw new Error('Leave request is not in pending status.');
	}

	// Verify subordinate relationship
	const targetEmployment = await leaveDao.getEmploymentByEmployeeCuid(request.employee_cuid);
	let rejector = await employeeDao.getEmployeeByCuid(rejectorUserCuid);
	if (!rejector) {
		rejector = await employeeDao.getEmployeeByEmpCode(rejectorUserCuid);
	}
	if (!rejector) {
		throw new Error('Rejector employee record not found.');
	}
	if (!targetEmployment || targetEmployment.reporting_manager_cuid !== rejector.cuid) {
		throw new Error('Unauthorized: You can only approve/reject requests from your direct reports.');
	}

	return leaveDao.updateLeaveRequest(requestCuid, {
		request_status: 'rejected',
		rejected_by: rejectorUserCuid,
		rejected_at: new Date(),
		updated_by: rejectorUserCuid
	});
}

export async function getLeaveDocument(cuid: string, currentUserEmail: string) {
	const request = await leaveDao.getLeaveRequestByCuid(cuid);
	if (!request || !request.file_name || !request.document_data) {
		throw new Error('Document not found');
	}

	const { employee: currentUser } = await resolveEmployee(currentUserEmail);
	if (!currentUser) {
		throw new Error('Unauthorized');
	}

	let isAuthorized = false;
	if (request.employee_cuid === currentUser.cuid) {
		isAuthorized = true;
	} else {
		const targetEmployment = await leaveDao.getEmploymentByEmployeeCuid(request.employee_cuid);
		if (targetEmployment && targetEmployment.reporting_manager_cuid === currentUser.cuid) {
			isAuthorized = true;
		}
	}

	if (!isAuthorized) {
		throw new Error('Forbidden');
	}

	return {
		documentData: request.document_data,
		mimeType: request.mime_type,
		fileName: request.file_name
	};
}
