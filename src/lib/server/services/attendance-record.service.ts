import * as attendanceRecordDao from '$lib/server/dao/attendance-record.dao.js';
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

export interface CreateAttendanceRecordDto {
	employee_cuid: unknown;
	attendance_date: unknown;
	check_in_time?: unknown;
	check_out_time?: unknown;
	attendance_status: unknown;
	attendance_source_cuid?: unknown;
	remarks?: unknown;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface UpdateAttendanceRecordDto {
	employee_cuid?: unknown;
	attendance_date?: unknown;
	check_in_time?: unknown;
	check_out_time?: unknown;
	attendance_status?: unknown;
	attendance_source_cuid?: unknown;
	remarks?: unknown;
	updated_by?: string | null;
}

function parseDateOnly(raw: unknown, fieldName: string): Date {
	if (!raw || (typeof raw === 'string' && raw.trim() === '')) {
		throw new AttendanceValidationError(fieldName, `${fieldName.replace('_', ' ')} is required`);
	}

	let date: Date;

	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (match) {
			const year = parseInt(match[1], 10);
			const month = parseInt(match[2], 10) - 1; // 0-indexed
			const day = parseInt(match[3], 10);
			date = new Date(Date.UTC(year, month, day));
		} else {
			date = new Date(trimmed);
		}
	} else if (raw instanceof Date) {
		date = new Date(Date.UTC(raw.getFullYear(), raw.getMonth(), raw.getDate()));
	} else {
		throw new AttendanceValidationError(fieldName, `${fieldName.replace('_', ' ')} must be a valid date`);
	}

	if (isNaN(date.getTime())) {
		throw new AttendanceValidationError(fieldName, `${fieldName.replace('_', ' ')} must be a valid date`);
	}

	return date;
}

function parseDateTime(raw: unknown, fieldName: string): Date | null {
	if (raw === undefined || raw === null || raw === '') return null;
	const date = new Date(raw as any);
	if (isNaN(date.getTime())) {
		throw new AttendanceValidationError(fieldName, `${fieldName.replace('_', ' ')} must be a valid timestamp`);
	}
	return date;
}

async function validateRecordFields(
	dto: CreateAttendanceRecordDto | UpdateAttendanceRecordDto,
	isUpdate = false,
	excludeCuid?: string
) {
	const errors: Record<string, string> = {};

	let employee_cuid: string | undefined;
	let attendance_date: Date | undefined;
	let attendance_status: string | undefined;
	let attendance_source_cuid: string | null | undefined;
	let remarks: string | null | undefined;

	// 1. Employee Validation
	if (!isUpdate || dto.employee_cuid !== undefined) {
		if (typeof dto.employee_cuid !== 'string' || !dto.employee_cuid.trim()) {
			errors.employee_cuid = 'Employee is required';
		} else {
			employee_cuid = dto.employee_cuid.trim();
			// Verify employee exists
			const empExists = await db.employee.findUnique({
				where: { uuid: employee_cuid }
			});
			if (!empExists) {
				errors.employee_cuid = 'Selected employee does not exist';
			}
		}
	}

	// 2. Date Validation
	if (!isUpdate || dto.attendance_date !== undefined) {
		try {
			attendance_date = parseDateOnly(dto.attendance_date, 'attendance_date');
		} catch (err: any) {
			errors.attendance_date = err.message;
		}
	}

	// 3. Status Validation
	if (!isUpdate || dto.attendance_status !== undefined) {
		if (typeof dto.attendance_status !== 'string' || !dto.attendance_status.trim()) {
			errors.attendance_status = 'Attendance status is required';
		} else {
			attendance_status = dto.attendance_status.trim();
		}
	}

	// 4. Source Validation
	if (dto.attendance_source_cuid !== undefined) {
		if (dto.attendance_source_cuid === null || dto.attendance_source_cuid === '') {
			attendance_source_cuid = null;
		} else if (typeof dto.attendance_source_cuid !== 'string') {
			errors.attendance_source_cuid = 'Attendance source must be a string';
		} else {
			attendance_source_cuid = dto.attendance_source_cuid.trim();
			const sourceExists = await db.attendanceSource.findUnique({
				where: { cuid: attendance_source_cuid }
			});
			if (!sourceExists) {
				errors.attendance_source_cuid = 'Selected attendance source does not exist';
			}
		}
	}

	if (dto.remarks !== undefined) {
		remarks = typeof dto.remarks === 'string' ? dto.remarks.trim() : null;
	}

	// Parse timestamps if provided
	let check_in_time: Date | null | undefined;
	let check_out_time: Date | null | undefined;

	if (dto.check_in_time !== undefined) {
		try {
			check_in_time = parseDateTime(dto.check_in_time, 'check_in_time');
		} catch (err: any) {
			errors.check_in_time = err.message;
		}
	}

	if (dto.check_out_time !== undefined) {
		try {
			check_out_time = parseDateTime(dto.check_out_time, 'check_out_time');
		} catch (err: any) {
			errors.check_out_time = err.message;
		}
	}

	if (Object.keys(errors).length > 0) {
		throw new AttendanceMultiValidationError(errors);
	}

	// Duplicate employee + date check
	const finalEmployee = employee_cuid ?? (isUpdate ? (await db.attendanceRecord.findUnique({ where: { cuid: excludeCuid } }))?.employee_cuid : undefined);
	const finalDate = attendance_date ?? (isUpdate ? (await db.attendanceRecord.findUnique({ where: { cuid: excludeCuid } }))?.attendance_date : undefined);

	if (finalEmployee && finalDate) {
		const existing = await attendanceRecordDao.findByEmployeeAndDate(finalEmployee, finalDate);
		if (existing && (!isUpdate || existing.cuid !== excludeCuid)) {
			errors.attendance_date = 'An attendance record already exists for this employee on this date';
			throw new AttendanceMultiValidationError(errors);
		}
	}

	// Calculate duration if check_in and check_out are present
	let work_duration_minutes: number | null | undefined = undefined;
	const finalCheckIn = check_in_time !== undefined ? check_in_time : (isUpdate ? (await db.attendanceRecord.findUnique({ where: { cuid: excludeCuid } }))?.check_in_time : null);
	const finalCheckOut = check_out_time !== undefined ? check_out_time : (isUpdate ? (await db.attendanceRecord.findUnique({ where: { cuid: excludeCuid } }))?.check_out_time : null);

	if (finalCheckIn && finalCheckOut) {
		if (finalCheckOut < finalCheckIn) {
			errors.check_out_time = 'Check out time cannot be before check in time';
			throw new AttendanceMultiValidationError(errors);
		}
		const diffMs = finalCheckOut.getTime() - finalCheckIn.getTime();
		work_duration_minutes = Math.round(diffMs / 1000 / 60);
	} else if (finalCheckIn === null || finalCheckOut === null) {
		work_duration_minutes = null;
	}

	return {
		employee_cuid: employee_cuid!,
		attendance_date: attendance_date!,
		check_in_time,
		check_out_time,
		work_duration_minutes,
		attendance_status: attendance_status!,
		attendance_source_cuid,
		remarks
	};
}

export async function listAttendanceRecords(filters: any = {}) {
	let parsedDate: Date | undefined;
	if (filters.attendance_date) {
		try {
			parsedDate = parseDateOnly(filters.attendance_date, 'attendance_date');
		} catch {
			// ignore invalid date filter
		}
	}

	return attendanceRecordDao.list({
		...filters,
		attendance_date: parsedDate
	});
}

export async function getAttendanceRecordByCuid(cuid: string) {
	if (!cuid) {
		throw new Error('Attendance Record CUID is required');
	}
	return attendanceRecordDao.findByCuid(cuid);
}

export async function createAttendanceRecord(dto: CreateAttendanceRecordDto) {
	const validated = await validateRecordFields(dto, false);
	return attendanceRecordDao.create({
		employee_cuid: validated.employee_cuid,
		attendance_date: validated.attendance_date,
		check_in_time: validated.check_in_time,
		check_out_time: validated.check_out_time,
		work_duration_minutes: validated.work_duration_minutes,
		attendance_status: validated.attendance_status,
		attendance_source_cuid: validated.attendance_source_cuid,
		remarks: validated.remarks,
		created_by: dto.created_by,
		updated_by: dto.updated_by
	});
}

export async function updateAttendanceRecord(cuid: string, dto: UpdateAttendanceRecordDto) {
	if (!cuid) {
		throw new Error('Attendance Record CUID is required for updates');
	}
	const validated = await validateRecordFields(dto, true, cuid);

	const updateData: any = {};
	if (dto.employee_cuid !== undefined) updateData.employee_cuid = validated.employee_cuid;
	if (dto.attendance_date !== undefined) updateData.attendance_date = validated.attendance_date;
	if (dto.check_in_time !== undefined) updateData.check_in_time = validated.check_in_time;
	if (dto.check_out_time !== undefined) updateData.check_out_time = validated.check_out_time;
	if (validated.work_duration_minutes !== undefined) updateData.work_duration_minutes = validated.work_duration_minutes;
	if (dto.attendance_status !== undefined) updateData.attendance_status = validated.attendance_status;
	if (dto.attendance_source_cuid !== undefined) updateData.attendance_source_cuid = validated.attendance_source_cuid;
	if (dto.remarks !== undefined) updateData.remarks = validated.remarks;
	updateData.updated_by = dto.updated_by;
	updateData.updated_at = new Date();

	return attendanceRecordDao.update(cuid, updateData);
}

export async function deleteAttendanceRecord(cuid: string) {
	if (!cuid) {
		throw new Error('Attendance Record CUID is required for deletion');
	}
	return attendanceRecordDao.deleteRecord(cuid);
}
