import * as attendanceRecordDao from '$lib/server/dao/attendance-record.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import { getLeaveStatusOnDate } from './attendance.service.js';
import { db } from '$lib/server/db.js';
import { auditFactory } from '$lib/server/factories/audit.factory.js';

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
	date: unknown;
	check_in_time?: unknown;
	check_out_time?: unknown;
	status: unknown;
	attendance_source_cuid?: unknown;
	remarks?: unknown;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface UpdateAttendanceRecordDto {
	employee_cuid?: unknown;
	date?: unknown;
	check_in_time?: unknown;
	check_out_time?: unknown;
	status?: unknown;
	attendance_source_cuid?: unknown;
	remarks?: unknown;
	updated_by?: string | null;
}

function capitalize(str: string): string {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseDateOnly(raw: unknown, fieldName: string): Date {
	if (!raw || (typeof raw === 'string' && raw.trim() === '')) {
		const display = fieldName === 'date' ? 'Attendance date' : capitalize(fieldName.replace('_', ' '));
		throw new AttendanceValidationError(fieldName, `${display} is required`);
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
		date = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()));
	} else {
		const display = fieldName === 'date' ? 'Attendance date' : capitalize(fieldName.replace('_', ' '));
		throw new AttendanceValidationError(fieldName, `${display} must be a valid date`);
	}

	if (isNaN(date.getTime())) {
		const display = fieldName === 'date' ? 'Attendance date' : capitalize(fieldName.replace('_', ' '));
		throw new AttendanceValidationError(fieldName, `${display} must be a valid date`);
	}

	return date;
}

function parseDateTime(raw: unknown, fieldName: string): Date | null {
	if (raw === undefined || raw === null || raw === '') return null;
	const date = new Date(raw as any);
	if (isNaN(date.getTime())) {
		throw new AttendanceValidationError(fieldName, `${capitalize(fieldName.replace('_', ' '))} must be a valid timestamp`);
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
	let date: Date | undefined;
	let status: string | undefined;
	let attendance_source_cuid: string | null | undefined;
	let remarks: string | null | undefined;

	// 1. Employee Validation
	if (!isUpdate || dto.employee_cuid !== undefined) {
		if (typeof dto.employee_cuid !== 'string' || !dto.employee_cuid.trim()) {
			errors.employee_cuid = 'Employee is required';
		} else {
			employee_cuid = dto.employee_cuid.trim();
			// Verify employee exists
			const empExists = await employeeDao.findByCuid2(employee_cuid);
			if (!empExists) {
				errors.employee_cuid = 'Selected employee does not exist';
			}
		}
	}

	// 2. Date Validation
	if (!isUpdate || dto.date !== undefined) {
		try {
			date = parseDateOnly(dto.date, 'date');
		} catch (err: any) {
			errors.date = err.message;
		}
	}

	// 3. Status Validation
	if (!isUpdate || dto.status !== undefined) {
		if (typeof dto.status !== 'string' || !dto.status.trim()) {
			errors.status = 'Attendance status is required';
		} else {
			status = dto.status.trim();
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
			const sourceExists = await masterDataDao.findByCuid2('attendance-sources', attendance_source_cuid);
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
	const existingRecord = isUpdate && excludeCuid ? await attendanceRecordDao.findByCuid(excludeCuid) : null;
	const finalEmployee = employee_cuid ?? (isUpdate ? existingRecord?.employee_cuid : undefined);
	const finalDate = date ?? (isUpdate ? existingRecord?.date : undefined);

	if (finalEmployee && finalDate) {
		const emp = await employmentDao.findByEmployeeCuid(finalEmployee);
		if (!emp || !emp.date_of_joining) {
			errors.employee_cuid = 'Selected employee has no valid employment record';
		} else {
			const recTime = new Date(Date.UTC(finalDate.getUTCFullYear(), finalDate.getUTCMonth(), finalDate.getUTCDate())).getTime();
			const joinTime = new Date(Date.UTC(emp.date_of_joining.getUTCFullYear(), emp.date_of_joining.getUTCMonth(), emp.date_of_joining.getUTCDate())).getTime();

			if (recTime < joinTime) {
				errors.date = 'Attendance date must be within employee\'s employment period.';
			} else if (emp.relieving_date) {
				const relieveTime = new Date(Date.UTC(emp.relieving_date.getUTCFullYear(), emp.relieving_date.getUTCMonth(), emp.relieving_date.getUTCDate())).getTime();
				if (recTime > relieveTime) {
					errors.date = 'Attendance date must be within employee\'s employment period.';
				}
			}
		}
		if (errors.employee_cuid || errors.date) {
			throw new AttendanceMultiValidationError(errors);
		}
	}

	if (finalDate) {
		const isHoliday = await holidayDao.findByDate(finalDate);
		if (isHoliday) {
			errors.date = 'Attendance cannot be marked on holidays';
			throw new AttendanceMultiValidationError(errors);
		}
	}

	if (finalEmployee && finalDate) {
		const existing = await attendanceRecordDao.findByEmployeeAndDate(finalEmployee, finalDate);
		if (existing && (!isUpdate || existing.cuid !== excludeCuid)) {
			errors.date = 'An attendance record already exists for this employee on this date';
			throw new AttendanceMultiValidationError(errors);
		}
	}

	// Calculate duration if check_in and check_out are present
	const finalCheckIn = check_in_time !== undefined ? check_in_time : (isUpdate ? existingRecord?.check_in_time : null);
	const finalCheckOut = check_out_time !== undefined ? check_out_time : (isUpdate ? existingRecord?.check_out_time : null);
	const finalStatus = status !== undefined ? status : (isUpdate ? existingRecord?.status : undefined);
	const finalSource = attendance_source_cuid !== undefined ? attendance_source_cuid : (isUpdate ? existingRecord?.attendance_source_cuid : null);

	if (finalEmployee && finalDate && finalStatus) {
		if (['Present', 'Late', 'WFH', 'Half Day'].includes(finalStatus)) {
			const leaveStatus = await getLeaveStatusOnDate(finalEmployee, finalDate);
			if (leaveStatus.hasLeave && !leaveStatus.isHalfDay) {
				errors.date = 'Attendance cannot be marked on leave or LOP days';
				throw new AttendanceMultiValidationError(errors);
			}
		}
	}

	if (finalStatus && ['Leave', 'Holiday', 'LOP'].includes(finalStatus)) {
		if (finalCheckIn) {
			errors.check_in_time = 'Check-in and check-out times must be removed for non-working statuses';
		}
		if (finalCheckOut) {
			errors.check_out_time = 'Check-in and check-out times must be removed for non-working statuses';
		}
		if (finalSource) {
			errors.attendance_source_cuid = 'Attendance source must be removed for non-working statuses';
		}
		if (errors.check_in_time || errors.check_out_time || errors.attendance_source_cuid) {
			throw new AttendanceMultiValidationError(errors);
		}
	}

	let work_duration_minutes: number | null | undefined = undefined;
	let resolvedCheckIn = finalCheckIn;
	let resolvedCheckOut = finalCheckOut;

	if (resolvedCheckIn && resolvedCheckOut) {
		let adjustedCheckOut = new Date(resolvedCheckOut);
		if (adjustedCheckOut < resolvedCheckIn) {
			adjustedCheckOut.setDate(adjustedCheckOut.getDate() + 1);
		}
		if (adjustedCheckOut < resolvedCheckIn) {
			errors.check_out_time = 'Check out time cannot be before check in time';
			throw new AttendanceMultiValidationError(errors);
		}
		const diffMs = adjustedCheckOut.getTime() - resolvedCheckIn.getTime();
		work_duration_minutes = Math.round(diffMs / 1000 / 60);
		resolvedCheckOut = adjustedCheckOut;
	} else if (resolvedCheckIn === null || resolvedCheckOut === null) {
		work_duration_minutes = null;
	}

	return {
		employee_cuid: employee_cuid!,
		date: date!,
		check_in_time: resolvedCheckIn,
		check_out_time: resolvedCheckOut,
		work_duration_minutes,
		status: status!,
		attendance_source_cuid,
		remarks
	};
}

export async function listAttendanceRecords(filters: any = {}) {
	let parsedDate: Date | undefined;
	if (filters.date) {
		try {
			parsedDate = parseDateOnly(filters.date, 'date');
		} catch {
			// ignore invalid date filter
		}
	}

	const records = await attendanceRecordDao.list({
		...filters,
		date: parsedDate
	});

	const employments = await employmentDao.list();
	const empMap = new Map(employments.map(e => [e.employee_cuid, e]));

	return records.filter(rec => {
		const emp = empMap.get(rec.employee_cuid);
		if (!emp || !emp.date_of_joining) return false;

		const recTime = new Date(Date.UTC(rec.date.getUTCFullYear(), rec.date.getUTCMonth(), rec.date.getUTCDate())).getTime();
		const joinTime = new Date(Date.UTC(emp.date_of_joining.getUTCFullYear(), emp.date_of_joining.getUTCMonth(), emp.date_of_joining.getUTCDate())).getTime();

		if (recTime < joinTime) return false;

		if (emp.relieving_date) {
			const relieveTime = new Date(Date.UTC(emp.relieving_date.getUTCFullYear(), emp.relieving_date.getUTCMonth(), emp.relieving_date.getUTCDate())).getTime();
			return recTime <= relieveTime;
		}
		return true;
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
	return db.$transaction(async (tx) => {
		const rec = (tx && Object.keys(tx).length > 0)
			? await attendanceRecordDao.create({
					employee_cuid: validated.employee_cuid,
					date: validated.date,
					check_in_time: validated.check_in_time,
					check_out_time: validated.check_out_time,
					work_duration_minutes: validated.work_duration_minutes,
					status: validated.status,
					attendance_source_cuid: validated.attendance_source_cuid,
					remarks: validated.remarks,
					created_by: dto.created_by,
					updated_by: dto.updated_by
				}, tx)
			: await attendanceRecordDao.create({
					employee_cuid: validated.employee_cuid,
					date: validated.date,
					check_in_time: validated.check_in_time,
					check_out_time: validated.check_out_time,
					work_duration_minutes: validated.work_duration_minutes,
					status: validated.status,
					attendance_source_cuid: validated.attendance_source_cuid,
					remarks: validated.remarks,
					created_by: dto.created_by,
					updated_by: dto.updated_by
				});

		await auditFactory.attendanceRecordCreated({
			entityCuid: rec.cuid,
			remarks: `Manual attendance record created for date ${validated.date.toISOString().split('T')[0]}.`
		}, tx);

		return rec;
	});
}

export async function updateAttendanceRecord(cuid: string, dto: UpdateAttendanceRecordDto) {
	if (!cuid) {
		throw new Error('Attendance Record CUID is required for updates');
	}
	const validated = await validateRecordFields(dto, true, cuid);
	const oldRecord = await attendanceRecordDao.findByCuid(cuid);
	if (!oldRecord) throw new Error('Attendance record not found');

	const updateData: any = {};
	if (dto.employee_cuid !== undefined) updateData.employee_cuid = validated.employee_cuid;
	if (dto.date !== undefined) updateData.date = validated.date;
	updateData.check_in_time = validated.check_in_time;
	updateData.check_out_time = validated.check_out_time;
	if (validated.work_duration_minutes !== undefined) updateData.work_duration_minutes = validated.work_duration_minutes;
	if (dto.status !== undefined) updateData.status = validated.status;
	if (dto.attendance_source_cuid !== undefined) updateData.attendance_source_cuid = validated.attendance_source_cuid;
	if (dto.remarks !== undefined) updateData.remarks = validated.remarks;
	updateData.updated_by = dto.updated_by;
	updateData.updated_at = new Date();

	return db.$transaction(async (tx) => {
		const updated = (tx && Object.keys(tx).length > 0)
			? await attendanceRecordDao.update(cuid, updateData, tx)
			: await attendanceRecordDao.update(cuid, updateData);

		await auditFactory.attendanceRecordUpdated({
			entityCuid: cuid,
			oldRecord,
			newRecord: updated
		}, tx);

		return updated;
	});
}
