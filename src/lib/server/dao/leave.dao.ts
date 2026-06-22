import { db } from '$lib/server/db.js';

export async function listLeaveTypes(tx?: any) {
	const client = tx || db;
	return client.leaveType.findMany({
		where: { status: true },
		orderBy: { name: 'asc' }
	});
}

export async function getLeaveTypeByCuid(cuid: string, tx?: any) {
	const client = tx || db;
	return client.leaveType.findUnique({
		where: { cuid }
	});
}

export async function listLeavePolicies(tx?: any) {
	const client = tx || db;
	return client.leavePolicy.findMany({
		where: { status: true }
	});
}

export async function getLeavePolicyByLeaveType(leaveTypeCuid: string, tx?: any) {
	const client = tx || db;
	return client.leavePolicy.findFirst({
		where: { leave_type_cuid: leaveTypeCuid, status: true }
	});
}

export async function getLeavePolicyEmploymentTypes(policyCuid: string, tx?: any) {
	const client = tx || db;
	return client.leavePolicyEmploymentType.findMany({
		where: { leave_policy_cuid: policyCuid }
	});
}

export async function getLeaveBalances(employeeCuid: string, year: number, tx?: any) {
	const client = tx || db;
	return client.leaveBalance.findMany({
		where: { employee_cuid: employeeCuid, year },
		orderBy: { id: 'asc' }
	});
}

export async function getLeaveBalance(employeeCuid: string, leaveTypeCuid: string, year: number, tx?: any) {
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
}, tx?: any) {
	const client = tx || db;
	return client.leaveBalance.create({
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
	},
	tx?: any
) {
	const client = tx || db;
	return client.leaveBalance.update({
		where: { cuid },
		data
	});
}

export async function getLeaveRequests(employeeCuid: string, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findMany({
		where: { employee_cuid: employeeCuid },
		orderBy: { created_at: 'desc' }
	});
}

export async function getLeaveRequestByCuid(cuid: string, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findUnique({
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
	file_name?: string | null;
	mime_type?: string | null;
	file_size?: number | null;
	document_data?: Buffer | Uint8Array | null;
	request_status?: string;
	days_from_primary?: number | string | any;
	days_from_lwp?: number | string | any;
	days_from_lop?: number | string | any;
	created_by?: string;
}, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.create({
		data: {
			employee_cuid: data.employee_cuid,
			leave_type_cuid: data.leave_type_cuid,
			start_date: data.start_date,
			end_date: data.end_date,
			total_days: data.total_days,
			is_half_day: data.is_half_day ?? false,
			half_day_session: data.half_day_session ?? null,
			reason: data.reason ?? null,
			file_name: data.file_name ?? null,
			mime_type: data.mime_type ?? null,
			file_size: data.file_size ?? null,
			document_data: (data.document_data as any) ?? null,
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
	},
	tx?: any
) {
	const client = tx || db;
	return client.leaveRequest.update({
		where: { cuid },
		data
	});
}

export async function getOverlappingRequests(employeeCuid: string, startDate: Date, endDate: Date, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findMany({
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
}, tx?: any) {
	const client = tx || db;
	return client.attendanceRecord.upsert({
		where: {
			employee_cuid_date: {
				employee_cuid: data.employee_cuid,
				date: data.attendance_date
			}
		},
		create: {
			employee_cuid: data.employee_cuid,
			date: data.attendance_date,
			status: data.attendance_status,
			remarks: data.remarks ?? null,
			created_by: data.created_by,
			updated_by: data.created_by
		},
		update: {
			status: data.attendance_status,
			remarks: data.remarks ?? null,
			updated_by: data.created_by
		}
	});
}

export async function getSubordinates(managerEmployeeCuid: string, tx?: any) {
	const client = tx || db;
	return client.employment.findMany({
		where: { reporting_manager_cuid: managerEmployeeCuid },
		select: { employee_cuid: true }
	});
}

export async function getEmploymentByEmployeeCuid(employeeCuid: string, tx?: any) {
	const client = tx || db;
	return client.employment.findFirst({
		where: { employee_cuid: employeeCuid }
	});
}

export async function getActiveEmploymentByEmployeeCuid(employeeCuid: string, tx?: any) {
	const client = tx || db;
	return client.employment.findFirst({
		where: { employee_cuid: employeeCuid, employment_status: 'active' }
	});
}

export async function getApprovedRequestsInPeriod(employeeCuid: string, cycleStart: Date, cycleEnd: Date, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findMany({
		where: {
			employee_cuid: employeeCuid,
			request_status: 'approved',
			start_date: { lte: cycleEnd },
			end_date: { gte: cycleStart }
		}
	});
}

export async function getApprovedRequestsBeforeDate(employeeCuid: string, leaveTypeCuid: string, endOfYear: Date, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findMany({
		where: {
			employee_cuid: employeeCuid,
			leave_type_cuid: leaveTypeCuid,
			request_status: 'approved',
			start_date: { lte: endOfYear }
		}
	});
}

export async function getApprovedRequestsInMonthRange(employeeCuid: string, leaveTypeCuid: string, start: Date, end: Date, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findMany({
		where: {
			employee_cuid: employeeCuid,
			leave_type_cuid: leaveTypeCuid,
			request_status: 'approved',
			start_date: {
				gte: start,
				lte: end
			}
		}
	});
}

export async function getApprovedRequestsOverlapping(start: Date, end: Date, tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findMany({
		where: {
			request_status: 'approved',
			start_date: { lte: end },
			end_date: { gte: start }
		}
	});
}

export async function getLeaveTypeByCode(leaveCode: string, tx?: any) {
	const client = tx || db;
	return client.leaveType.findFirst({
		where: { code: leaveCode }
	});
}

export async function getAttendanceRecord(employeeCuid: string, attendanceDate: Date, tx?: any) {
	const client = tx || db;
	return client.attendanceRecord.findUnique({
		where: {
			employee_cuid_date: {
				employee_cuid: employeeCuid,
				date: attendanceDate
			}
		}
	});
}

export async function getLeaveRequestsForEmployees(employeeCuids: string[], tx?: any) {
	const client = tx || db;
	return client.leaveRequest.findMany({
		where: {
			employee_cuid: { in: employeeCuids }
		},
		orderBy: { created_at: 'desc' }
	});
}

export async function runTransaction<T>(action: (tx: any) => Promise<T>): Promise<T> {
	return db.$transaction(action);
}
