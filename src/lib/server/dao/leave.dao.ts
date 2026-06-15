import { db } from '$lib/server/db.js';

export async function listLeaveTypes() {
	return db.leaveType.findMany({
		where: { status: true },
		orderBy: { leave_name: 'asc' }
	});
}

export async function getLeaveTypeByCuid(cuid: string) {
	return db.leaveType.findUnique({
		where: { cuid }
	});
}

export async function listLeavePolicies() {
	return db.leavePolicy.findMany({
		where: { status: true }
	});
}

export async function getLeavePolicyByLeaveType(leaveTypeCuid: string) {
	return db.leavePolicy.findFirst({
		where: { leave_type_cuid: leaveTypeCuid, status: true }
	});
}

export async function getLeavePolicyEmploymentTypes(policyCuid: string) {
	return db.leavePolicyEmploymentType.findMany({
		where: { leave_policy_cuid: policyCuid }
	});
}

export async function getLeaveBalances(employeeCuid: string, year: number) {
	return db.leaveBalance.findMany({
		where: { employee_cuid: employeeCuid, year },
		orderBy: { id: 'asc' }
	});
}

export async function getLeaveBalance(employeeCuid: string, leaveTypeCuid: string, year: number) {
	return db.leaveBalance.findUnique({
		where: {
			employee_cuid_leave_type_cuid_year: {
				employee_cuid: employeeCuid,
				leave_type_cuid: leaveTypeCuid,
				year
			}
		}
	});
}

export async function createLeaveBalance(data: {
	employee_cuid: string;
	leave_type_cuid: string;
	year: number;
	allocated_days: number | string | any;
	used_days?: number | string | any;
	remaining_days: number | string | any;
	carried_forward_days?: number | string | any;
	created_by?: string;
}) {
	return db.leaveBalance.create({
		data: {
			employee_cuid: data.employee_cuid,
			leave_type_cuid: data.leave_type_cuid,
			year: data.year,
			allocated_days: data.allocated_days,
			used_days: data.used_days ?? 0.0,
			remaining_days: data.remaining_days,
			carried_forward_days: data.carried_forward_days ?? 0.0,
			created_by: data.created_by,
			updated_by: data.created_by
		}
	});
}

export async function updateLeaveBalance(
	cuid: string,
	data: {
		allocated_days?: number | string | any;
		used_days?: number | string | any;
		remaining_days?: number | string | any;
		carried_forward_days?: number | string | any;
		updated_by?: string;
	}
) {
	return db.leaveBalance.update({
		where: { cuid },
		data
	});
}

export async function getLeaveRequests(employeeCuid: string) {
	return db.leaveRequest.findMany({
		where: { employee_cuid: employeeCuid },
		orderBy: { created_at: 'desc' }
	});
}

export async function getLeaveRequestByCuid(cuid: string) {
	return db.leaveRequest.findUnique({
		where: { cuid }
	});
}

export async function createLeaveRequest(data: {
	employee_cuid: string;
	leave_type_cuid: string;
	start_date: Date;
	end_date: Date;
	total_days: number | string | any;
	is_half_day?: boolean;
	half_day_session?: string | null;
	reason?: string | null;
	document_url?: string | null;
	request_status?: string;
	days_from_primary?: number | string | any;
	days_from_lwp?: number | string | any;
	days_from_lop?: number | string | any;
	created_by?: string;
}) {
	return db.leaveRequest.create({
		data: {
			employee_cuid: data.employee_cuid,
			leave_type_cuid: data.leave_type_cuid,
			start_date: data.start_date,
			end_date: data.end_date,
			total_days: data.total_days,
			is_half_day: data.is_half_day ?? false,
			half_day_session: data.half_day_session ?? null,
			reason: data.reason ?? null,
			document_url: data.document_url ?? null,
			request_status: data.request_status ?? 'pending',
			days_from_primary: data.days_from_primary ?? null,
			days_from_lwp: data.days_from_lwp ?? null,
			days_from_lop: data.days_from_lop ?? null,
			created_by: data.created_by,
			updated_by: data.created_by
		}
	});
}

export async function updateLeaveRequest(
	cuid: string,
	data: {
		request_status?: string;
		approved_by?: string | null;
		approved_at?: Date | null;
		rejected_by?: string | null;
		rejected_at?: Date | null;
		withdrawn_at?: Date | null;
		updated_by?: string;
	}
) {
	return db.leaveRequest.update({
		where: { cuid },
		data
	});
}

export async function getOverlappingRequests(employeeCuid: string, startDate: Date, endDate: Date) {
	return db.leaveRequest.findMany({
		where: {
			employee_cuid: employeeCuid,
			request_status: { in: ['pending', 'approved'] },
			start_date: { lte: endDate },
			end_date: { gte: startDate }
		}
	});
}

export async function upsertAttendanceRecord(data: {
	employee_cuid: string;
	attendance_date: Date;
	attendance_status: string;
	remarks?: string | null;
	created_by?: string;
}) {
	return db.attendanceRecord.upsert({
		where: {
			employee_cuid_attendance_date: {
				employee_cuid: data.employee_cuid,
				attendance_date: data.attendance_date
			}
		},
		create: {
			employee_cuid: data.employee_cuid,
			attendance_date: data.attendance_date,
			attendance_status: data.attendance_status,
			remarks: data.remarks ?? null,
			created_by: data.created_by,
			updated_by: data.created_by
		},
		update: {
			attendance_status: data.attendance_status,
			remarks: data.remarks ?? null,
			updated_by: data.created_by
		}
	});
}

export async function getSubordinates(managerEmployeeCuid: string) {
	return db.employment.findMany({
		where: { reporting_manager_cuid: managerEmployeeCuid },
		select: { employee_cuid: true }
	});
}
