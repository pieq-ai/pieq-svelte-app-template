import * as attendanceDao from '$lib/server/dao/attendance.dao.js';
import { db } from '$lib/server/db.js';

export class AttendanceValidationError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'AttendanceValidationError';
		this.field = field;
	}
}

export class AttendanceMultiValidationError extends Error {
	readonly fields: Record<string, string>;
	constructor(fields: Record<string, string>) {
		super('Validation failed');
		this.name = 'AttendanceMultiValidationError';
		this.fields = fields;
	}
}

async function getOrCreateWebSource(): Promise<string> {
	const existing = await db.attendanceSource.findFirst({
		where: { attendance_source_name: { equals: 'Web', mode: 'insensitive' } }
	});
	if (existing) {
		return existing.cuid;
	}
	const created = await db.attendanceSource.create({
		data: { attendance_source_name: 'Web' }
	});
	return created.cuid;
}

export async function checkIn(employeeCuid: string, attendanceSourceCuid?: string | null, createdBy?: string | null) {
	if (!employeeCuid) {
		throw new AttendanceValidationError('employee_cuid', 'Employee is required');
	}

	// Verify employee exists
	const empExists = await db.employee.findUnique({
		where: { uuid: employeeCuid }
	});
	if (!empExists) {
		throw new AttendanceValidationError('employee_cuid', 'Selected employee does not exist');
	}

	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

	// Check if already checked in
	const existing = await attendanceDao.findByEmployeeAndDate(employeeCuid, todayUTC);
	if (existing) {
		throw new AttendanceValidationError('employee_cuid', 'Already checked in for today');
	}

	let sourceCuid = attendanceSourceCuid;
	if (!sourceCuid) {
		sourceCuid = await getOrCreateWebSource();
	} else {
		// Verify source if provided
		const sourceExists = await db.attendanceSource.findUnique({
			where: { cuid: sourceCuid }
		});
		if (!sourceExists) {
			throw new AttendanceValidationError('attendance_source_cuid', 'Selected source does not exist');
		}
	}

	return attendanceDao.create({
		employee_cuid: employeeCuid,
		attendance_date: todayUTC,
		check_in_time: today,
		attendance_status: 'Present',
		attendance_source_cuid: sourceCuid,
		created_by: createdBy,
		updated_by: createdBy
	});
}

export async function checkOut(employeeCuid: string, updatedBy?: string | null) {
	if (!employeeCuid) {
		throw new AttendanceValidationError('employee_cuid', 'Employee is required');
	}

	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

	const existing = await attendanceDao.findByEmployeeAndDate(employeeCuid, todayUTC);
	if (!existing) {
		throw new AttendanceValidationError('employee_cuid', 'No check-in record found for today');
	}

	if (existing.check_out_time) {
		throw new AttendanceValidationError('employee_cuid', 'Already checked out for today');
	}

	const checkInTime = existing.check_in_time ? new Date(existing.check_in_time) : today;
	const diffMs = today.getTime() - checkInTime.getTime();
	const minutes = Math.round(diffMs / 1000 / 60);

	return attendanceDao.update(existing.cuid, {
		check_out_time: today,
		work_duration_minutes: Math.max(0, minutes),
		updated_by: updatedBy,
		updated_at: today
	});
}

export async function getEmployeeHistory(employeeCuid: string) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required');
	}
	return attendanceDao.listByEmployee(employeeCuid);
}

export async function getTodayStatus(employeeCuid: string) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required');
	}
	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	return attendanceDao.findByEmployeeAndDate(employeeCuid, todayUTC);
}
