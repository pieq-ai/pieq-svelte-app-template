import { db } from '$lib/server/db.js';

export interface CreateAttendanceInput {
	employee_cuid: string;
	date: Date;
	check_in_time?: Date | null;
	check_out_time?: Date | null;
	work_duration_minutes?: number | null;
	status: string;
	attendance_source_cuid?: string | null;
	remarks?: string | null;
	created_by?: string | null;
	updated_by?: string | null;
	check_in_latitude?: number | null;
	check_in_longitude?: number | null;
}

export interface UpdateAttendanceInput {
	check_in_time?: Date | null;
	check_in_latitude?: number | null;
	check_in_longitude?: number | null;
	attendance_source_cuid?: string | null;
	check_out_time?: Date | null;
	work_duration_minutes?: number | null;
	status?: string;
	updated_by?: string | null;
	updated_at?: Date;
	check_out_latitude?: number | null;
	check_out_longitude?: number | null;
}

export async function findByEmployeeAndDate(employee_cuid: string, date: Date) {
	return db.attendanceRecord.findFirst({
		where: {
			employee_cuid,
			date: date
		}
	});
}

export async function listByEmployee(employee_cuid: string, startDate?: Date, endDate?: Date) {
	const whereClause: any = { employee_cuid };
	if (startDate || endDate) {
		whereClause.date = {};
		if (startDate) whereClause.date.gte = startDate;
		if (endDate) whereClause.date.lte = endDate;
	}
	return db.attendanceRecord.findMany({
		where: whereClause,
		orderBy: [
			{ date: 'desc' },
			{ created_at: 'desc' }
		]
	});
}

export async function create(data: CreateAttendanceInput) {
	return db.attendanceRecord.create({
		data: {
			employee_cuid: data.employee_cuid,
			date: data.date,
			check_in_time: data.check_in_time ?? null,
			check_out_time: data.check_out_time ?? null,
			work_duration_minutes: data.work_duration_minutes ?? null,
			status: data.status,
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

export async function findOpenRecord(employee_cuid: string) {
	return db.attendanceRecord.findFirst({
		where: {
			employee_cuid,
			check_in_time: { not: null },
			check_out_time: null
		}
	});
}

export async function findOpenRecordOnDate(employee_cuid: string, date: Date) {
	return db.attendanceRecord.findFirst({
		where: {
			employee_cuid,
			date: date,
			check_in_time: { not: null },
			check_out_time: null
		}
	});
}

export async function findByCuid(cuid: string) {
	return db.attendanceRecord.findUnique({
		where: { cuid }
	});
}

export async function findPendingCheckOuts(employee_cuid: string, maxAgeDays: number = 7) {
	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	
	const minDate = new Date(todayUTC);
	minDate.setUTCDate(minDate.getUTCDate() - maxAgeDays);

	return db.attendanceRecord.findMany({
		where: {
			employee_cuid,
			date: {
				lt: todayUTC,
				gte: minDate
			},
			check_in_time: { not: null },
			check_out_time: null
		},
		orderBy: {
			date: 'desc'
		}
	});
}

