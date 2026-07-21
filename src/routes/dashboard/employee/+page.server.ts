import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { canAccess } from '$lib/authz/index.js';
import { resolveEmployee, getEmployeeLeaveDetails } from '$lib/server/services/leave.service.js';
import * as departmentDao from '$lib/server/dao/department.dao.js';
import * as designationDao from '$lib/server/dao/designation.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import { getTodayStatus } from '$lib/server/services/attendance.service.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}
	if (!canAccess(locals.user, 'dashboard:employee')) {
		throw error(403, 'Unauthorized: You do not have permission to access the employee dashboard.');
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

	if (!employee) {
		throw error(401, 'Unauthorized: Employee record not found');
	}

	// Always retrieve the employment details if we have an employee (allowing both active & onboarding)
	// This ensures details like Reporting Manager are fetched correctly even for onboarding employees.
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

	let activeShift = null;
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

	// 3. Fetch and Compute Monthly Attendance Stats
	const startOfMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
	const endOfMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));

	const attendanceRecordsThisMonth = await db.attendanceRecord.findMany({
		where: {
			employee_cuid: employee.cuid,
			date: {
				gte: startOfMonth,
				lte: endOfMonth
			}
		}
	});

	let presentDaysCount = 0;
	let totalWorkMinutes = 0;
	for (const rec of attendanceRecordsThisMonth) {
		if (rec.status === 'Present' || rec.status === 'WFH') {
			presentDaysCount += 1;
		} else if (rec.status === 'HalfDay' || rec.status === 'Half Day') {
			presentDaysCount += 0.5;
		}
		if (rec.work_duration_minutes) {
			totalWorkMinutes += rec.work_duration_minutes;
		}
	}

	// Working days in this month so far (weekdays, excluding holidays)
	const holidaysThisMonth = await db.holidayCalendar.findMany({
		where: {
			date: {
				gte: startOfMonth,
				lte: todayUTC
			}
		}
	});
	const holidayDates = new Set(holidaysThisMonth.map((h) => new Date(h.date).toDateString()));

	let workingDaysSoFar = 0;
	const tempDate = new Date(startOfMonth);
	while (tempDate <= today) {
		const dayOfWeek = tempDate.getUTCDay();
		const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0=Sunday, 6=Saturday
		if (!isWeekend && !holidayDates.has(tempDate.toDateString())) {
			workingDaysSoFar++;
		}
		tempDate.setDate(tempDate.getDate() + 1);
	}

	let totalMinutes = 0;
	let totalWorkingDays = 0;

	const holidayDatesString = new Set(
		holidaysThisMonth.map((h) => new Date(h.date).toISOString().split('T')[0])
	);

	for (const rec of attendanceRecordsThisMonth) {
		const recDateStr = rec.date.toISOString().split('T')[0];

		// Ignore future dates (if any)
		if (recDateStr > todayUTC.toISOString().split('T')[0]) {
			continue;
		}

		// Exclude weekends/week-offs entirely from both hours and days
		const dayOfWeek = rec.date.getUTCDay();
		if (dayOfWeek === 0 || dayOfWeek === 6) {
			continue;
		}

		// Exclude holidays from both hours and days
		if (holidayDatesString.has(recDateStr)) {
			continue;
		}

		// Exclude leaves and LOPs from both hours and days
		const status = rec.status;
		if (status === 'Leave' || status === 'On Leave' || status === 'LOP') {
			continue;
		}

		// Ignore attendance entries without a completed check-out
		if (!rec.check_out_time || rec.work_duration_minutes === null || rec.work_duration_minutes === undefined) {
			continue;
		}

		// Count only actual attendance duration from valid weekday attendance records
		const duration = rec.work_duration_minutes;
		if (duration !== null && duration !== undefined && duration >= 0) {
			totalMinutes += duration;
		}

		// Count working days:
		// Present = 1 day, Late = 1 day, WFH = 1 day
		// Half Day = 0.5 day
		if (status === 'Present' || status === 'Late' || status === 'WFH') {
			totalWorkingDays += 1;
		} else if (status === 'Half Day' || status === 'HalfDay') {
			totalWorkingDays += 0.5;
		}
	}

	let averageWorkingHours = '0h 00m';
	if (totalWorkingDays > 0) {
		const avgMinutes = Math.round(totalMinutes / totalWorkingDays);
		const hrs = Math.floor(avgMinutes / 60);
		const mins = avgMinutes % 60;
		averageWorkingHours = `${hrs}h ${String(mins).padStart(2, '0')}m`;
	}

	const thisMonthHours = Math.round(totalMinutes / 60);

	// 4. Fetch Leave Balances & Pending Leave Requests for Current Year
	let leaveBalanceCount = 0;
	let pendingLeaveRequestsCount = 0;

	try {
		const leaveDetails = await getEmployeeLeaveDetails(employment?.official_email || email, today.getFullYear());
		leaveBalanceCount = leaveDetails.balances
			.filter((b: any) => ['CL', 'SL', 'EL'].includes(b.leave_code))
			.reduce(
				(sum: number, b: any) => sum + (Number(b.remaining_days) || 0),
				0
			);
		pendingLeaveRequestsCount = leaveDetails.requests.filter(
			(r: any) => r.request_status === 'pending'
		).length;
	} catch (err) {
		console.error('Failed to load leave details for dashboard:', err);
	}

	// 5. Fetch Today's Attendance Record Status
	let todayAttendance = null;
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

	// 6. Fetch Upcoming Holidays
	const holidays = await holidayDao.list();
	const upcomingHolidays = holidays
		.filter((h) => new Date(h.date) >= todayUTC)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	const upcomingHolidaysCount = upcomingHolidays.length;

	// 7. Compute Upcoming Events Feed (Top 5: Holidays)
	const upcomingEvents = upcomingHolidays.slice(0, 5).map((h) => ({
		type: 'holiday',
		name: h.name,
		date: h.date.toISOString(),
		holidayType: h.type
	}));

	// Date of joining stats
	let memberSince = '—';
	if (employment?.date_of_joining) {
		const doj = new Date(employment.date_of_joining);
		memberSince = doj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	// 8. Fetch Team Details (Reporting Hierarchy Only)
	let teamMembers: {
		cuid: string;
		name: string;
		emp_code: string;
		designation: string;
		memberRole: 'Manager' | 'Employee';
	}[] = [];

	if (employment?.reporting_manager_cuid) {
		const managerCuid = employment.reporting_manager_cuid;

		// Fetch Reporting Manager profile
		const managerProfile = await db.employee.findFirst({
			where: { cuid: managerCuid, is_deleted: false },
			select: { cuid: true, first_name: true, last_name: true, emp_code: true }
		});

		if (managerProfile) {
			let mgrDesignation = '—';
			const mgrEmployment = await db.employment.findFirst({
				where: { employee_cuid: managerCuid, employment_status: { in: ['active', 'onboarding'] } }
			});
			if (mgrEmployment?.designation_cuid) {
				const desig = await designationDao.findByCuid2(mgrEmployment.designation_cuid);
				if (desig) mgrDesignation = desig.name;
			}
			teamMembers.push({
				cuid: managerProfile.cuid,
				name: `${managerProfile.first_name} ${managerProfile.last_name}`,
				emp_code: managerProfile.emp_code,
				designation: mgrDesignation,
				memberRole: 'Manager'
			});
		}

		// Fetch teammates (employees reporting to the same manager, excluding logged-in employee)
		const teammateEmployments = await db.employment.findMany({
			where: {
				reporting_manager_cuid: managerCuid,
				employee_cuid: { not: employee.cuid },
				employment_status: { in: ['active', 'onboarding'] }
			}
		});

		if (teammateEmployments.length > 0) {
			const teammateCuids = teammateEmployments.map((e) => e.employee_cuid);
			const teammateProfiles = await db.employee.findMany({
				where: { cuid: { in: teammateCuids }, is_deleted: false },
				select: { cuid: true, first_name: true, last_name: true, emp_code: true }
			});

			for (const profile of teammateProfiles) {
				const emp = teammateEmployments.find((e) => e.employee_cuid === profile.cuid);
				let desigName = '—';
				if (emp?.designation_cuid) {
					const desig = await designationDao.findByCuid2(emp.designation_cuid);
					if (desig) desigName = desig.name;
				}
				teamMembers.push({
					cuid: profile.cuid,
					name: `${profile.first_name} ${profile.last_name}`,
					emp_code: profile.emp_code,
					designation: desigName,
					memberRole: 'Employee'
				});
			}
		}
	}

	// 9. Determine if this employee is a manager (has active subordinates)
	const subordinatesEmployments = await db.employment.findMany({
		where: {
			reporting_manager_cuid: employee.cuid,
			employment_status: { in: ['active', 'onboarding'] }
		},
		select: { employee_cuid: true }
	});
	const activeSubordinatesCount = await db.employee.count({
		where: {
			cuid: { in: subordinatesEmployments.map(e => e.employee_cuid) },
			is_deleted: false
		}
	});
	const isManager = activeSubordinatesCount > 0;

	// 10. Fetch latest payroll record to check for payslips
	const latestPayroll = await db.payroll.findFirst({
		where: { employee_cuid: employee.cuid },
		orderBy: [
			{ year: 'desc' },
			{ month: 'desc' }
		]
	});
	const latestPayrollCuid = latestPayroll?.cuid ?? null;

	return {
		context: {
			user: locals.user,
			roles: locals.roles,
			stats: {
				memberSince,
				roleCount: locals.roles.length
			}
		},
		showAdminSection: locals.roles.includes('admin'),
		employee: {
			cuid: employee.cuid,
			emp_code: employee.emp_code,
			first_name: employee.first_name,
			last_name: employee.last_name,
			department: departmentName,
			designation: designationName,
			reportingManager: reportingManagerName
		},
		activeShift,
		todayAttendance,
		latestPayrollCuid,
		upcomingEvents,
		stats: {
			presentDays: presentDaysCount,
			leaveBalance: leaveBalanceCount,
			pendingLeave: pendingLeaveRequestsCount,
			averageWorkingHours,
			thisMonthHours,
			upcomingHolidaysCount
		},
		isManager,
		teamMembers
	};
};
