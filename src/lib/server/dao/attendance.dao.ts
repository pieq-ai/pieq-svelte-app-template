import { db } from '$lib/server/db.js';

export interface CreateAttendanceInput {
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
	check_in_latitude?: number | null;
	check_in_longitude?: number | null;
}

export interface UpdateAttendanceInput {
	check_out_time?: Date | null;
	work_duration_minutes?: number | null;
	updated_by?: string | null;
	updated_at?: Date;
	check_out_latitude?: number | null;
	check_out_longitude?: number | null;
}

export async function findByEmployeeAndDate(employee_cuid: string, attendance_date: Date) {
	return db.attendanceRecord.findFirst({
		where: {
			employee_cuid,
			attendance_date
		}
	});
}

export async function listByEmployee(employee_cuid: string) {
	return db.attendanceRecord.findMany({
		where: { employee_cuid },
		orderBy: [
			{ attendance_date: 'desc' },
			{ created_at: 'desc' }
		]
	});
}

export async function create(data: CreateAttendanceInput) {
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
			updated_by: data.updated_by ?? null,
			check_in_latitude: data.check_in_latitude ?? null,
			check_in_longitude: data.check_in_longitude ?? null
		}
	});
}

export async function update(cuid: string, data: UpdateAttendanceInput) {
	return db.attendanceRecord.update({
		where: { cuid },
		data
	});
}
