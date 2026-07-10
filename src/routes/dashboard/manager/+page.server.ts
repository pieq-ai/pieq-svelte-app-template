import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { resolveEmployee, getEmployeeLeaveDetails } from '$lib/server/services/leave.service.js';
import * as departmentDao from '$lib/server/dao/department.dao.js';
import * as designationDao from '$lib/server/dao/designation.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import { getTodayStatus } from '$lib/server/services/attendance.service.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/');
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

	const attendancePercentage = workingDaysSoFar > 0
		? Math.min(100, Math.round((presentDaysCount / workingDaysSoFar) * 100))
		: 100;

	const thisMonthHours = Math.round(totalWorkMinutes / 60);

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

	// 7. Date of joining stats
	let memberSince = '—';
	if (employment?.date_of_joining) {
		const doj = new Date(employment.date_of_joining);
		memberSince = doj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	// 8. MANAGER DASHBOARD DATA LOADER
	// Check if this employee is a manager (has subordinates)
	let subordinatesEmploymentList = await db.employment.findMany({
		where: {
			reporting_manager_cuid: employee.cuid,
			employment_status: { in: ['active', 'onboarding'] }
		}
	});

	if (subordinatesEmploymentList.length > 0) {
		const activeSubordinates = await db.employee.findMany({
			where: {
				cuid: { in: subordinatesEmploymentList.map((s) => s.employee_cuid) },
				is_deleted: false
			},
			select: { cuid: true }
		});
		const activeSubordinateCuidsSet = new Set(activeSubordinates.map((e) => e.cuid));
		subordinatesEmploymentList = subordinatesEmploymentList.filter((s) => activeSubordinateCuidsSet.has(s.employee_cuid));
	}

	let previewDepartmentName = departmentName;
	let previewDesignationName = designationName;
	let previewManagerEmpCode = employee.emp_code;

	let previewEmployment = employment;

	// Fallback to first manager in system if logged-in user is not a manager (for preview purposes)
	if (subordinatesEmploymentList.length === 0) {
		const anySub = await db.employment.findFirst({
			where: {
				reporting_manager_cuid: { not: null },
				employment_status: { in: ['active', 'onboarding'] }
			}
		});
		if (anySub?.reporting_manager_cuid) {
			const managerCuidForLookup = anySub.reporting_manager_cuid;
			subordinatesEmploymentList = await db.employment.findMany({
				where: {
					reporting_manager_cuid: managerCuidForLookup,
					employment_status: { in: ['active', 'onboarding'] }
				}
			});

			if (subordinatesEmploymentList.length > 0) {
				const activeSubordinates = await db.employee.findMany({
					where: {
						cuid: { in: subordinatesEmploymentList.map((s) => s.employee_cuid) },
						is_deleted: false
					},
					select: { cuid: true }
				});
				const activeSubordinateCuidsSet = new Set(activeSubordinates.map((e) => e.cuid));
				subordinatesEmploymentList = subordinatesEmploymentList.filter((s) => activeSubordinateCuidsSet.has(s.employee_cuid));
			}

			const previewMgrEmp = await db.employee.findUnique({
				where: { cuid: managerCuidForLookup }
			});
			if (previewMgrEmp) {
				previewManagerEmpCode = previewMgrEmp.emp_code;
				previewEmployment = await db.employment.findFirst({
					where: { employee_cuid: managerCuidForLookup, employment_status: { in: ['active', 'onboarding'] } }
				});
				if (previewEmployment) {
					if (previewEmployment.department_cuid) {
						const dept = await departmentDao.findByCuid2(previewEmployment.department_cuid);
						if (dept) previewDepartmentName = dept.name;
					}
					if (previewEmployment.designation_cuid) {
						const desig = await designationDao.findByCuid2(previewEmployment.designation_cuid);
						if (desig) previewDesignationName = desig.name;
					}
				}
			}
		}
	}

	const isManager = true; // Always expose switcher for testing/validation
	let managerContext = null;

	if (subordinatesEmploymentList.length > 0) {
		const currentYear = today.getFullYear();
		const subordinateCuids = subordinatesEmploymentList.map((s) => s.employee_cuid);

		// Fetch subordinate employee profiles
		const subordinateEmployees = await db.employee.findMany({
			where: {
				cuid: { in: subordinateCuids },
				is_deleted: false
			},
			select: {
				cuid: true,
				first_name: true,
				last_name: true,
				emp_code: true
			}
		});

		// Fetch all departments, designations, and roles to map values
		const [subDepartments, subDesignations, subRoles] = await Promise.all([
			db.department.findMany(),
			db.designation.findMany(),
			db.role.findMany()
		]);

		const subDesigMap = new Map(subDesignations.map((d) => [d.cuid, d.name]));
		const subRoleMap = new Map(subRoles.map((r) => [r.cuid, r.name]));

		// Map employee CUID to employment details
		const subordinateEmploymentMap = new Map(subordinatesEmploymentList.map((s) => [s.employee_cuid, s]));

		// Fetch shift assignments of subordinates for today
		const subordinateAssignments = await db.shiftAssignment.findMany({
			where: {
				employee_cuid: { in: subordinateCuids },
				status: true,
				effective_from: { lte: todayUTC },
				OR: [
					{ effective_to: { gte: todayUTC } },
					{ effective_to: null }
				]
			}
		});

		const subShiftCuids = subordinateAssignments.map((a) => a.shift_cuid);
		const subordinateShifts = await db.shift.findMany({
			where: { cuid: { in: subShiftCuids } }
		});
		const subShiftMap = new Map(subordinateShifts.map((s) => [s.cuid, s]));
		const empShiftMap = new Map(subordinateAssignments.map((a) => [a.employee_cuid, subShiftMap.get(a.shift_cuid)]));

		// Manager's own "Team" (role name)
		let managerTeamName = '—';
		if (previewEmployment?.role_cuid) {
			const role = subRoleMap.get(previewEmployment.role_cuid);
			if (role) managerTeamName = role;
		}
		if (managerTeamName === '—' && previewDesignationName !== '—') {
			managerTeamName = previewDesignationName;
		}

		// Fetch subordinate attendance records for today
		const todaySubRecords = await db.attendanceRecord.findMany({
			where: {
				employee_cuid: { in: subordinateCuids },
				date: todayUTC
			}
		});
		const todaySubRecordsMap = new Map(todaySubRecords.map((r) => [r.employee_cuid, r]));

		// Fetch subordinate leave requests on active approved status today
		const activeLeavesToday = await db.leaveRequest.findMany({
			where: {
				employee_cuid: { in: subordinateCuids },
				request_status: 'approved',
				start_date: { lte: todayUTC },
				end_date: { gte: todayUTC }
			}
		});
		const activeLeavesMap = new Set(activeLeavesToday.map((l) => l.employee_cuid));

		// Compute metrics count
		let totalMembersCount = subordinateEmployees.length;

		// Map subordinate profiles to daily list
		const teamAttendanceList = subordinateEmployees.map((emp) => {
			const empl = subordinateEmploymentMap.get(emp.cuid);
			const desig = empl?.designation_cuid ? subDesigMap.get(empl.designation_cuid) : '—';
			const rec = todaySubRecordsMap.get(emp.cuid);
			const shift = empShiftMap.get(emp.cuid);

			let checkInTime = null;
			let checkOutTime = null;
			let status = 'Absent';

			if (rec) {
				checkInTime = rec.check_in_time ? rec.check_in_time.toISOString() : null;
				checkOutTime = rec.check_out_time ? rec.check_out_time.toISOString() : null;

				if (rec.status === 'WFH') {
					status = 'WFH';
				} else if (rec.status === 'Leave' || rec.status === 'On Leave' || rec.status === 'LOP') {
					status = 'On Leave';
				} else {
					// Compare check-in with shift start
					if (rec.check_in_time && shift) {
						const shiftStart = new Date(rec.check_in_time);
						const shiftD = new Date(shift.start_time);
						shiftStart.setUTCHours(shiftD.getUTCHours(), shiftD.getUTCMinutes(), 0, 0);

						if (new Date(rec.check_in_time) > shiftStart) {
							status = 'Late In';
						} else {
							status = 'On-Time';
						}
					} else {
						status = 'On-Time';
					}
				}
			} else if (activeLeavesMap.has(emp.cuid)) {
				status = 'On Leave';
			}

			return {
				cuid: emp.cuid,
				name: `${emp.first_name} ${emp.last_name}`,
				designation: desig,
				check_in_time: checkInTime,
				check_out_time: checkOutTime,
				status
			};
		});

		let presentCount = 0;
		let wfhCount = 0;
		let onLeaveCount = 0;
		let absentCount = 0;

		for (const member of teamAttendanceList) {
			if (member.status === 'On-Time' || member.status === 'Late In') {
				presentCount++;
			} else if (member.status === 'WFH') {
				wfhCount++;
			} else if (member.status === 'On Leave') {
				onLeaveCount++;
			} else {
				absentCount++;
			}
		}

		// Fetch approvals count (subordinate pending requests)
		const pendingApprovalsCount = await db.leaveRequest.count({
			where: {
				employee_cuid: { in: subordinateCuids },
				request_status: 'pending'
			}
		});

		// Fetch leave types mapping to get human readable names
		const activeLeaveTypes = await db.leaveType.findMany();
		const leaveTypeMap = new Map(activeLeaveTypes.map((t) => [t.cuid, t.name]));

		// Recent Leave Requests of subordinates
		const recentLeaveRequests = await db.leaveRequest.findMany({
			where: {
				employee_cuid: { in: subordinateCuids }
			},
			orderBy: {
				created_at: 'desc'
			},
			take: 5
		});

		const mappedLeaveRequests = recentLeaveRequests.map((req) => {
			const emp = subordinateEmployees.find((e) => e.cuid === req.employee_cuid);
			const empl = subordinateEmploymentMap.get(req.employee_cuid);
			const desig = empl?.designation_cuid ? subDesigMap.get(empl.designation_cuid) : '—';
			const typeName = leaveTypeMap.get(req.leave_type_cuid) || 'Leave';

			// Duration formatting
			let durationStr = '1 Day';
			if (req.is_half_day) {
				durationStr = 'Half Day';
			} else if (req.total_days) {
				durationStr = `${Number(req.total_days)} Days`;
			}

			// Format status casing
			let statusLabel = 'Pending';
			if (req.request_status === 'approved') statusLabel = 'Approved';
			else if (req.request_status === 'rejected') statusLabel = 'Rejected';

			return {
				cuid: req.cuid,
				employeeName: emp ? `${emp.first_name} ${emp.last_name}` : '—',
				designation: desig,
				type: typeName,
				duration: durationStr,
				status: statusLabel
			};
		});

		// Fetch only the next 5 upcoming holidays for manager events
		const managerEvents = upcomingHolidays.slice(0, 5).map((h) => ({
			type: 'holiday',
			name: h.name,
			date: h.date.toISOString(),
			label: 'Holiday'
		}));

		managerContext = {
			managerId: previewManagerEmpCode,
			departmentName: previewDepartmentName,
			teamName: managerTeamName,
			metrics: {
				totalMembers: totalMembersCount,
				present: presentCount + wfhCount,
				onLeave: onLeaveCount,
				approvals: pendingApprovalsCount,
				holidays: upcomingHolidaysCount
			},
			todayPresence: {
				present: presentCount + wfhCount,
				wfh: wfhCount,
				absent: absentCount
			},
			teamAttendance: teamAttendanceList,
			leaveRequests: mappedLeaveRequests,
			events: managerEvents
		};
	}

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
		isManager,
		managerContext
	};
};
