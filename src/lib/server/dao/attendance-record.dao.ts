import { db } from '$lib/server/db.js';

export interface CreateAttendanceRecordInput {
	employee_cuid: string;
	attendance_date: Date;
	check_in_time?: Date | null;
	check_out_time?: Date | null;
	work_duration_minutes?: number | null;
	attendance_status: string;
	attendance_source_cuid?: string | null;
	remarks?: string | null;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface UpdateAttendanceRecordInput {
	employee_cuid?: string;
	attendance_date?: Date;
	check_in_time?: Date | null;
	check_out_time?: Date | null;
	work_duration_minutes?: number | null;
	attendance_status?: string;
	attendance_source_cuid?: string | null;
	remarks?: string | null;
	updated_by?: string | null;
	updated_at?: Date;
}

export interface AttendanceRecordFilters {
	employee_cuid?: string;
	attendance_date?: Date;
	attendance_status?: string;
	attendance_source_cuid?: string;
}

export async function list(filters: AttendanceRecordFilters = {}) {
	const whereClause: any = {};

	if (filters.employee_cuid) {
		whereClause.employee_cuid = filters.employee_cuid;
	}

	if (filters.attendance_date) {
		whereClause.attendance_date = filters.attendance_date;
	}

	if (filters.attendance_status) {
		whereClause.attendance_status = filters.attendance_status;
	}

	if (filters.attendance_source_cuid) {
		whereClause.attendance_source_cuid = filters.attendance_source_cuid;
	}

	return db.attendanceRecord.findMany({
		where: whereClause,
		orderBy: [
			{ attendance_date: 'desc' },
			{ created_at: 'desc' }
		]
	});
}

export async function findByCuid(cuid: string) {
	return db.attendanceRecord.findUnique({
		where: { cuid }
	});
}

export async function findByEmployeeAndDate(employee_cuid: string, attendance_date: Date) {
	return db.attendanceRecord.findFirst({
		where: {
			employee_cuid,
			attendance_date
		}
	});
}

export async function create(data: CreateAttendanceRecordInput) {
	return db.attendanceRecord.create({
		data: {
			employee_cuid: data.employee_cuid,
			attendance_date: data.attendance_date,
			check_in_time: data.check_in_time ?? null,
			check_out_time: data.check_out_time ?? null,
			work_duration_minutes: data.work_duration_minutes ?? null,
			attendance_status: data.attendance_status,
			attendance_source_cuid: data.attendance_source_cuid ?? null,
			remarks: data.remarks ?? null,
			created_by: data.created_by ?? null,
			updated_by: data.updated_by ?? null
		}
	});
}

export async function update(cuid: string, data: UpdateAttendanceRecordInput) {
	return db.attendanceRecord.update({
		where: { cuid },
		data
	});
}

export async function deleteRecord(cuid: string) {
	return db.attendanceRecord.delete({
		where: { cuid }
	});
}
