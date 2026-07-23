import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { canAccess } from '$lib/authz/index.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as departmentDao from '$lib/server/dao/department.dao.js';
import * as designationDao from '$lib/server/dao/designation.dao.js';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import { getTodayStatus } from '$lib/server/services/attendance.service.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/');
	}
	if (!canAccess(locals.user, 'dashboard:admin')) {
		redirect(302, '/dashboard');
	}

	const email = locals.user.email;
	let employee = null;
	let employment = null;

	try {
		const resolved = await resolveEmployee(email);
		employee = resolved?.employee ?? null;
		employment = resolved?.employment ?? null;
	} catch (err) {
		console.error('Failed to resolve employee session details:', err);
	}



	// Always retrieve the employment details if we have an employee
	if (employee && !employment) {
		employment = await db.employment.findFirst({
			where: {
				employee_cuid: employee.cuid,
				employment_status: { in: ['active', 'onboarding'] }
			}
		});
	}

	// 1. Fetch Department, Designation, and Reporting Manager names
	let departmentName = '—';
	let designationName = '—';
	let reportingManagerName = '—';

	if (employment) {
		if (employment.department_cuid) {
			const dept = await departmentDao.findByCuid2(employment.department_cuid);
			if (dept) departmentName = dept.name;
		}
		if (employment.designation_cuid) {
			const desig = await designationDao.findByCuid2(employment.designation_cuid);
			if (desig) designationName = desig.name;
		}
		if (employment.reporting_manager_cuid) {
			const mgr = await employeeDao.getEmployeeByCuid(employment.reporting_manager_cuid);
			if (mgr && !mgr.is_deleted) reportingManagerName = `${mgr.first_name} ${mgr.last_name}`;
		}
	}

	// 2. Fetch Active Shift for Today
	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

	let activeShift = null;
	if (employee) {
		const activeAssignment = await db.shiftAssignment.findFirst({
			where: {
				employee_cuid: employee.cuid,
				status: true,
				effective_from: { lte: todayUTC },
				OR: [
					{ effective_to: { gte: todayUTC } },
					{ effective_to: null }
				]
			}
		});

		if (activeAssignment?.shift_cuid) {
			const shift = await db.shift.findUnique({
				where: { cuid: activeAssignment.shift_cuid }
			});
			if (shift) {
				activeShift = {
					cuid: shift.cuid,
					name: shift.name,
					start_time: shift.start_time.toISOString(),
					end_time: shift.end_time.toISOString()
				};
			}
		}
	}

	let todayAttendance = null;
	if (employee) {
		const todayStatusRecord = await getTodayStatus(employee.cuid);
		if (todayStatusRecord) {
			todayAttendance = {
				cuid: todayStatusRecord.cuid,
				status: todayStatusRecord.status,
				check_in_time: todayStatusRecord.check_in_time ? todayStatusRecord.check_in_time.toISOString() : null,
				check_out_time: todayStatusRecord.check_out_time ? todayStatusRecord.check_out_time.toISOString() : null,
				work_duration_minutes: todayStatusRecord.work_duration_minutes
			};
		}
	}

	// Fetch distinct periods from payrolls to populate the month selector dropdown
	const rawPeriods = await db.payroll.findMany({
		distinct: ['month', 'year'],
		select: { month: true, year: true },
		orderBy: [{ year: 'desc' }, { month: 'desc' }]
	});

	const periods = rawPeriods.map((p) => ({
		value: `${p.year}-${p.month}`,
		label: `${getMonthName(p.month)} ${p.year}`,
		month: p.month,
		year: p.year
	}));

	// Select target period
	let targetMonth = new Date().getMonth() + 1;
	let targetYear = new Date().getFullYear();

	const periodParam = url.searchParams.get('period');
	if (periodParam) {
		const [yearStr, monthStr] = periodParam.split('-');
		const y = parseInt(yearStr);
		const m = parseInt(monthStr);
		if (!isNaN(y) && !isNaN(m)) {
			targetYear = y;
			targetMonth = m;
		}
	} else if (periods.length > 0) {
		targetYear = periods[0].year;
		targetMonth = periods[0].month;
	}

	const selectedPeriodValue = `${targetYear}-${targetMonth}`;

	// 1. Total Employees
	const totalEmployees = await db.employee.count({
		where: { is_deleted: false }
	});

	const firstOfPeriod = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
	const lastOfPeriod = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
	const newEmployeesThisMonth = await db.employee.count({
		where: {
			created_at: { gte: firstOfPeriod, lte: lastOfPeriod },
			is_deleted: false
		}
	});

	// 2. Active Users (employees with status 'active')
	const activeUsers = await db.employment.count({
		where: { employment_status: 'active' }
	});

	const newActiveUsers = await db.employment.count({
		where: {
			employment_status: 'active',
			created_at: { gte: firstOfPeriod, lte: lastOfPeriod }
		}
	});

	// 3. Departments
	const departmentsCount = await db.department.count({
		where: { status: true }
	});

	// 4. Component breakdown & Payroll totals for Donut Chart
	const payrolls = await db.payroll.findMany({
		where: { month: targetMonth, year: targetYear }
	});

	let basicSalary = 0;
	let allowances = 0;
	let deductions = 0;
	let bonuses = 0;
	let others = 0;

	const deductionKeys = ['pf', 'provident', 'tax', 'deduction', 'esi', 'lwf', 'pt', 'insurance', 'loan', 'advance'];
	const basicKeys = ['basic', 'base'];
	const bonusKeys = ['bonus', 'incentive', 'commission', 'gratuity', 'ex-gratia', 'variable'];
	const otherKeys = ['other', 'misc', 'reimbursement', 'meal', 'food', 'conveyance'];

	for (const p of payrolls) {
		const breakdown = p.breakdown as Record<string, number>;
		if (breakdown && typeof breakdown === 'object') {
			for (const [key, value] of Object.entries(breakdown)) {
				const lowerKey = key.toLowerCase();
				const absoluteVal = Math.abs(Number(value)) || 0;

				if (deductionKeys.some(dk => lowerKey.includes(dk)) || value < 0) {
					deductions += absoluteVal;
				} else if (basicKeys.some(bk => lowerKey.includes(bk))) {
					basicSalary += absoluteVal;
				} else if (bonusKeys.some(bk => lowerKey.includes(bk))) {
					bonuses += absoluteVal;
				} else if (otherKeys.some(ok => lowerKey.includes(ok))) {
					others += absoluteVal;
				} else {
					allowances += absoluteVal;
				}
			}
		}
	}

	const sumCurrent = await db.payroll.aggregate({
		_sum: { gross_earnings: true, net_salary: true },
		where: { month: targetMonth, year: targetYear }
	});

	const grossFromBreakdown = basicSalary + allowances + bonuses + others;
	const dbGross = Number(sumCurrent._sum.gross_earnings) || 0;
	const totalPayroll = grossFromBreakdown > 0 ? grossFromBreakdown : dbGross;
	const netPayroll = Number(sumCurrent._sum.net_salary) || (totalPayroll - deductions);

	// MoM Trends
	const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
	const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;

	const sumPrev = await db.payroll.aggregate({
		_sum: { gross_earnings: true, net_salary: true },
		where: { month: prevMonth, year: prevYear }
	});

	const prevPayrolls = await db.payroll.findMany({
		where: { month: prevMonth, year: prevYear }
	});

	let prevGrossFromBreakdown = 0;
	let prevDeductions = 0;

	for (const p of prevPayrolls) {
		const breakdown = p.breakdown as Record<string, number>;
		if (breakdown && typeof breakdown === 'object') {
			for (const [key, value] of Object.entries(breakdown)) {
				const lowerKey = key.toLowerCase();
				const absoluteVal = Math.abs(Number(value)) || 0;
				if (deductionKeys.some(dk => lowerKey.includes(dk)) || value < 0) {
					prevDeductions += absoluteVal;
				} else {
					prevGrossFromBreakdown += absoluteVal;
				}
			}
		}
	}

	const prevDbGross = Number(sumPrev._sum.gross_earnings) || 0;
	const prevTotalPayroll = prevGrossFromBreakdown > 0 ? prevGrossFromBreakdown : prevDbGross;

	const totalPayrollTrend = prevTotalPayroll > 0
		? ((totalPayroll - prevTotalPayroll) / prevTotalPayroll) * 100
		: 0;

	const totalComponents = basicSalary + allowances + deductions + bonuses + others;
	const basicPercent = totalComponents > 0 ? (basicSalary / totalComponents) * 100 : 0;
	const allowancesPercent = totalComponents > 0 ? (allowances / totalComponents) * 100 : 0;
	const deductionsPercent = totalComponents > 0 ? (deductions / totalComponents) * 100 : 0;
	const bonusesPercent = totalComponents > 0 ? (bonuses / totalComponents) * 100 : 0;
	const othersPercent = totalComponents > 0 ? (others / totalComponents) * 100 : 0;

	const deductionsTrend = prevDeductions > 0 ? ((deductions - prevDeductions) / prevDeductions) * 100 : 0;

	// Expenses MTD (mocked at 5% of payroll for representation, trending with it)
	const expenses = totalPayroll * 0.05;
	const prevExpenses = prevTotalPayroll * 0.05;
	const expensesTrend = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

	// 6. Bottom Row Stats
	// Resignations count (employment relieved in current month)
	const resignations = await db.employment.count({
		where: {
			relieving_date: { gte: firstOfPeriod, lte: lastOfPeriod }
		}
	});
	const prevResignations = await db.employment.count({
		where: {
			relieving_date: {
				gte: new Date(Date.UTC(prevYear, prevMonth - 1, 1)),
				lte: new Date(Date.UTC(prevYear, prevMonth, 0, 23, 59, 59, 999))
			}
		}
	});

	// Fetch Upcoming Holidays
	const holidaysList = await holidayDao.list();
	const upcomingHolidays = holidaysList
		.filter((h) => new Date(h.date) >= todayUTC)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	const upcomingHolidaysCount = upcomingHolidays.length;

	// Today's Attendance count
	const presentToday = await db.attendanceRecord.count({
		where: {
			date: todayUTC,
			status: { in: ['Present', 'present', 'WFH', 'wfh', 'HalfDay', 'half_day', 'Half Day'] }
		}
	});
	const attendancePercentage = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

	return {
		employee: employee ? {
			cuid: employee.cuid,
			emp_code: employee.emp_code,
			first_name: employee.first_name,
			last_name: employee.last_name,
			department: departmentName,
			designation: designationName,
			reportingManager: reportingManagerName
		} : null,
		activeShift,
		todayAttendance,
		periods,
		selectedPeriodValue,
		stats: {
			totalEmployees,
			newEmployeesThisMonth,
			activeUsers,
			newActiveUsers,
			departmentsCount,
			totalPayroll,
			totalPayrollTrend,
			expenses,
			expensesTrend,
			deductions,
			deductionsTrend,
			upcomingHolidaysCount
		},
		breakdown: {
			basicSalary,
			basicPercent,
			allowances,
			allowancesPercent,
			deductions,
			deductionsPercent,
			bonuses,
			bonusesPercent,
			others,
			othersPercent
		},
		bottomStats: {
			newEmployeesThisMonth,
			resignations,
			resignationsTrend: resignations - prevResignations,
			presentToday,
			attendancePercentage,
			performanceReviews: 22, // Static mock matching image
			performanceReviewsTrend: 4 // Static mock matching image
		}
	};
};

function getMonthName(month: number): string {
	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];
	return months[month - 1] ?? 'Unknown';
}
