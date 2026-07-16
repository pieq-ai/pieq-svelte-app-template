import * as attendanceDao from '$lib/server/dao/attendance.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';
import { GEOFENCE_CONFIG, calculateDistance } from '$lib/geofence.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as locationDao from '$lib/server/dao/organization_location.dao.js';
import * as leaveDao from '$lib/server/dao/leave.dao.js';

export async function getLeaveStatusOnDate(employeeCuid: string, date: Date, tx?: any) {
	const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

	const approvedLeaves = await leaveDao.getApprovedRequestsInPeriod(employeeCuid, dateUTC, dateUTC, tx);
	const approvedLeave = approvedLeaves[0] || null;

	if (approvedLeave) {
		return {
			hasLeave: true,
			isHalfDay: approvedLeave.is_half_day
		};
	}

	return {
		hasLeave: false,
		isHalfDay: false
	};
}

export async function getAttendanceEligibility(employeeCuid: string, date: Date, tx?: any) {
	const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

	// 1. Holiday check
	const isHoliday = await holidayDao.findByDate(dateUTC);
	if (isHoliday) {
		return { eligible: false, reason: 'Attendance cannot be marked on holidays' };
	}

	// 2. Existing attendance record check (Leave, On Leave, LOP status)
	const existing = await attendanceDao.findByEmployeeAndDate(employeeCuid, dateUTC);
	if (existing && (existing.status === 'Leave' || existing.status === 'On Leave' || existing.status === 'LOP')) {
		return { eligible: false, reason: 'Attendance cannot be marked on leave or LOP days' };
	}

	// 3. Approved leave request check
	const leaveStatus = await getLeaveStatusOnDate(employeeCuid, dateUTC, tx);
	if (leaveStatus.hasLeave && !leaveStatus.isHalfDay) {
		return { eligible: false, reason: 'Attendance cannot be marked on leave or LOP days' };
	}

	return { eligible: true, reason: null };
}

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
	const existing = await masterDataDao.findAttendanceSourceByName('Web');
	if (existing) {
		return existing.cuid;
	}
	const created = await masterDataDao.createAttendanceSource('Web');
	return created.cuid;
}

export async function checkIn(
	employeeCuid: string,
	attendanceSourceCuid?: string | null,
	createdBy?: string | null,
	gpsData?: { latitude: number; longitude: number } | null
) {
	if (!employeeCuid) {
		throw new AttendanceValidationError('employee_cuid', 'Employee is required');
	}

	// Verify employee exists
	const empExists = await employeeDao.findByCuid2(employeeCuid);
	if (!empExists) {
		throw new AttendanceValidationError('employee_cuid', 'Selected employee does not exist');
	}

	// Fetch employee's employment details
	const employment = await employmentDao.findByEmployeeCuid(employeeCuid);

	if (!employment || !employment.date_of_joining) {
		throw new AttendanceValidationError('employee_cuid', 'Selected employee has no valid employment record');
	}

	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

	const joinDate = new Date(Date.UTC(employment.date_of_joining.getUTCFullYear(), employment.date_of_joining.getUTCMonth(), employment.date_of_joining.getUTCDate()));
	if (todayUTC < joinDate) {
		throw new AttendanceValidationError('employee_cuid', 'Attendance date must be within employee\'s employment period.');
	}

	if (employment.relieving_date) {
		const relieveDate = new Date(Date.UTC(employment.relieving_date.getUTCFullYear(), employment.relieving_date.getUTCMonth(), employment.relieving_date.getUTCDate()));
		if (todayUTC > relieveDate) {
			throw new AttendanceValidationError('employee_cuid', 'Attendance date must be within employee\'s employment period.');
		}
	}

	// Check attendance eligibility (holiday, full-day leave)
	const eligibility = await getAttendanceEligibility(employeeCuid, todayUTC);
	if (!eligibility.eligible) {
		throw new AttendanceValidationError('employee_cuid', eligibility.reason!);
	}

	// Check for open attendance record for today
	const openRecordToday = await attendanceDao.findOpenRecordOnDate(employeeCuid, todayUTC);
	if (openRecordToday) {
		throw new AttendanceValidationError('employee_cuid', 'An open attendance record already exists for today. Please check out first.');
	}

	// Check if already checked in
	const existing = await attendanceDao.findByEmployeeAndDate(employeeCuid, todayUTC);
	if (existing && existing.check_in_time) {
		throw new AttendanceValidationError('employee_cuid', 'Already checked in for today');
	}

	// Geofence Validation
	if (
		!gpsData ||
		gpsData.latitude === undefined || gpsData.latitude === null || isNaN(gpsData.latitude) ||
		gpsData.longitude === undefined || gpsData.longitude === null || isNaN(gpsData.longitude)
	) {
		throw new AttendanceValidationError('employee_cuid', 'GPS coordinates are required to mark attendance');
	}

	if (!employment.location_cuid) {
		throw new AttendanceValidationError('employee_cuid', 'No company location has been assigned');
	}

	const location = await locationDao.getLocationByCuid(employment.location_cuid);
	if (!location) {
		throw new AttendanceValidationError('employee_cuid', 'No company location has been assigned');
	}

	const officeLat = location.latitude !== null && location.latitude !== undefined ? Number(location.latitude) : null;
	const officeLon = location.longitude !== null && location.longitude !== undefined ? Number(location.longitude) : null;

	if (officeLat === null || officeLon === null || isNaN(officeLat) || isNaN(officeLon)) {
		throw new AttendanceValidationError('employee_cuid', 'Company location is not properly configured');
	}

	const { latitude, longitude } = gpsData;

	const dist = calculateDistance(latitude, longitude, officeLat, officeLon);
	if (dist > GEOFENCE_CONFIG.ALLOWED_RADIUS_METERS) {
		throw new AttendanceValidationError('employee_cuid', 'You are outside the office zone');
	}

	let sourceCuid = attendanceSourceCuid;
	if (!sourceCuid) {
		sourceCuid = await getOrCreateWebSource();
	} else {
		// Verify source if provided
		const sourceExists = await masterDataDao.findByCuid2('attendance-sources', sourceCuid);
		if (!sourceExists) {
			throw new AttendanceValidationError('attendance_source_cuid', 'Selected source does not exist');
		}
	}

	if (existing) {
		return attendanceDao.update(existing.cuid, {
			check_in_time: today,
			check_in_latitude: latitude,
			check_in_longitude: longitude,
			attendance_source_cuid: sourceCuid,
			status: existing.status === 'Half Day' ? 'Half Day' : 'Present',
			updated_by: createdBy,
			updated_at: today
		});
	}

	return attendanceDao.create({
		employee_cuid: employeeCuid,
		date: todayUTC,
		check_in_time: today,
		status: 'Present',
		attendance_source_cuid: sourceCuid,
		created_by: createdBy,
		updated_by: createdBy,
		check_in_latitude: latitude,
		check_in_longitude: longitude
	});
}

export async function checkOut(
	employeeCuid: string,
	updatedBy?: string | null,
	gpsData?: { latitude: number; longitude: number } | null,
	attendanceRecordCuid?: string | null,
	checkOutTimeInput?: Date | string | null
) {
	if (!employeeCuid) {
		throw new AttendanceValidationError('employee_cuid', 'Employee is required');
	}

	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

	// Verify employee exists
	const empExists = await employeeDao.findByCuid2(employeeCuid);
	if (!empExists) {
		throw new AttendanceValidationError('employee_cuid', 'Selected employee does not exist');
	}

	// Fetch employee's employment details
	const employment = await employmentDao.findByEmployeeCuid(employeeCuid);

	if (!employment || !employment.date_of_joining) {
		throw new AttendanceValidationError('employee_cuid', 'Selected employee has no valid employment record');
	}

	// For normal check-out, perform eligibility validation for today first to align with the expected behavior of existing unit tests
	if (!attendanceRecordCuid) {
		const eligibility = await getAttendanceEligibility(employeeCuid, todayUTC);
		if (!eligibility.eligible) {
			throw new AttendanceValidationError('employee_cuid', eligibility.reason!);
		}
	}

	let existing: any;
	if (attendanceRecordCuid) {
		existing = await attendanceDao.findByCuid(attendanceRecordCuid);
		if (!existing) {
			throw new AttendanceValidationError('employee_cuid', 'Selected attendance record does not exist');
		}
		if (existing.employee_cuid !== employeeCuid) {
			throw new AttendanceValidationError('employee_cuid', 'Selected attendance record does not belong to the authenticated employee');
		}
		if (existing.check_out_time) {
			throw new AttendanceValidationError('employee_cuid', 'Selected attendance record is already checked out');
		}

		// Validate that the record is not older than 7 days
		const recordDate = new Date(existing.date);
		const diffTime = todayUTC.getTime() - recordDate.getTime();
		const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
		if (diffDays > 7) {
			throw new AttendanceValidationError('employee_cuid', 'Pending check-out has expired (grace period is 7 days)');
		}
	} else {
		existing = await attendanceDao.findOpenRecordOnDate(employeeCuid, todayUTC);
		if (!existing) {
			throw new AttendanceValidationError('employee_cuid', 'No open check-in record found');
		}
	}

	const recordDateUTC = new Date(Date.UTC(existing.date.getUTCFullYear(), existing.date.getUTCMonth(), existing.date.getUTCDate()));

	const joinDate = new Date(Date.UTC(employment.date_of_joining.getUTCFullYear(), employment.date_of_joining.getUTCMonth(), employment.date_of_joining.getUTCDate()));
	if (recordDateUTC < joinDate) {
		throw new AttendanceValidationError('employee_cuid', 'Attendance date must be within employee\'s employment period.');
	}

	if (employment.relieving_date) {
		const relieveDate = new Date(Date.UTC(employment.relieving_date.getUTCFullYear(), employment.relieving_date.getUTCMonth(), employment.relieving_date.getUTCDate()));
		if (recordDateUTC > relieveDate) {
			throw new AttendanceValidationError('employee_cuid', 'Attendance date must be within employee\'s employment period.');
		}
	}

	// Check attendance eligibility (holiday, full-day leave) only for pending check-out (already checked for today's above)
	if (attendanceRecordCuid) {
		const eligibility = await getAttendanceEligibility(employeeCuid, recordDateUTC);
		if (!eligibility.eligible) {
			throw new AttendanceValidationError('employee_cuid', eligibility.reason!);
		}
	}

	if (existing.status === 'Leave' || existing.status === 'On Leave' || existing.status === 'LOP') {
		throw new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days');
	}

	// Check-out time validations and determination
	let checkOutTime: Date;
	if (checkOutTimeInput) {
		checkOutTime = new Date(checkOutTimeInput);
		if (isNaN(checkOutTime.getTime())) {
			throw new AttendanceValidationError('employee_cuid', 'Invalid check-out time provided');
		}
		if (existing.check_in_time && checkOutTime <= new Date(existing.check_in_time)) {
			throw new AttendanceValidationError('employee_cuid', 'Check-out time must be later than check-in time');
		}
		const checkOutDateUTC = new Date(Date.UTC(checkOutTime.getUTCFullYear(), checkOutTime.getUTCMonth(), checkOutTime.getUTCDate()));
		if (checkOutDateUTC.getTime() !== recordDateUTC.getTime()) {
			throw new AttendanceValidationError('employee_cuid', 'Check-out time must belong to the same attendance date');
		}
	} else {
		if (attendanceRecordCuid) {
			throw new AttendanceValidationError('employee_cuid', 'Check-out time is required for pending check-out');
		}
		checkOutTime = today;
	}

	// Geofence Validation
	if (
		!gpsData ||
		gpsData.latitude === undefined || gpsData.latitude === null || isNaN(gpsData.latitude) ||
		gpsData.longitude === undefined || gpsData.longitude === null || isNaN(gpsData.longitude)
	) {
		throw new AttendanceValidationError('employee_cuid', 'GPS coordinates are required to mark attendance');
	}

	if (!employment.location_cuid) {
		throw new AttendanceValidationError('employee_cuid', 'No company location has been assigned');
	}

	const location = await locationDao.getLocationByCuid(employment.location_cuid);
	if (!location) {
		throw new AttendanceValidationError('employee_cuid', 'No company location has been assigned');
	}

	const officeLat = location.latitude !== null && location.latitude !== undefined ? Number(location.latitude) : null;
	const officeLon = location.longitude !== null && location.longitude !== undefined ? Number(location.longitude) : null;

	if (officeLat === null || officeLon === null || isNaN(officeLat) || isNaN(officeLon)) {
		throw new AttendanceValidationError('employee_cuid', 'Company location is not properly configured');
	}

	const { latitude, longitude } = gpsData;

	const dist = calculateDistance(latitude, longitude, officeLat, officeLon);
	if (dist > GEOFENCE_CONFIG.ALLOWED_RADIUS_METERS) {
		throw new AttendanceValidationError('employee_cuid', 'You are outside the office zone');
	}

	const checkInTime = existing.check_in_time ? new Date(existing.check_in_time) : checkOutTime;
	const diffMs = checkOutTime.getTime() - checkInTime.getTime();
	const minutes = Math.round(diffMs / 1000 / 60);

	return attendanceDao.update(existing.cuid, {
		check_out_time: checkOutTime,
		work_duration_minutes: Math.max(0, minutes),
		updated_by: updatedBy,
		updated_at: new Date(),
		check_out_latitude: latitude,
		check_out_longitude: longitude
	});
}

export async function getEmployeeHistory(employeeCuid: string) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required');
	}

	const employment = await employmentDao.findByEmployeeCuid(employeeCuid);

	if (!employment || !employment.date_of_joining) {
		return [];
	}

	const startDate = new Date(Date.UTC(employment.date_of_joining.getUTCFullYear(), employment.date_of_joining.getUTCMonth(), employment.date_of_joining.getUTCDate()));
	let endDate: Date;

	if (employment.relieving_date) {
		endDate = new Date(Date.UTC(employment.relieving_date.getUTCFullYear(), employment.relieving_date.getUTCMonth(), employment.relieving_date.getUTCDate()));
	} else {
		// Set default endDate to far future (2099-12-31) to include future scheduled attendance records
		endDate = new Date(Date.UTC(2099, 11, 31));
	}

	return attendanceDao.listByEmployee(employeeCuid, startDate, endDate);
}

export async function getTodayStatus(employeeCuid: string) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required');
	}

	const employment = await employmentDao.findByEmployeeCuid(employeeCuid);

	if (!employment || !employment.date_of_joining) {
		return null;
	}

	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

	const joinDate = new Date(Date.UTC(employment.date_of_joining.getUTCFullYear(), employment.date_of_joining.getUTCMonth(), employment.date_of_joining.getUTCDate()));
	if (todayUTC < joinDate) {
		return null;
	}

	if (employment.relieving_date) {
		const relieveDate = new Date(Date.UTC(employment.relieving_date.getUTCFullYear(), employment.relieving_date.getUTCMonth(), employment.relieving_date.getUTCDate()));
		if (todayUTC > relieveDate) {
			return null;
		}
	}

	return attendanceDao.findByEmployeeAndDate(employeeCuid, todayUTC);
}

export async function getPendingCheckOuts(employeeCuid: string) {
	const records = await attendanceDao.findPendingCheckOuts(employeeCuid);
	return records.map((rec) => ({
		cuid: rec.cuid,
		date: rec.date.toISOString().split('T')[0],
		check_in_time: rec.check_in_time ? rec.check_in_time.toISOString() : null,
		status: rec.status
	}));
}
