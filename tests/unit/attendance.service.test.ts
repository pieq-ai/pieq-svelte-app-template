import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as attendanceDao from '$lib/server/dao/attendance.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';
import {
	checkIn,
	checkOut,
	getEmployeeHistory,
	getTodayStatus,
	getPendingCheckOuts,
	AttendanceValidationError
} from '$lib/server/services/attendance.service.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as locationDao from '$lib/server/dao/organization_location.dao.js';
import * as leaveDao from '$lib/server/dao/leave.dao.js';

vi.mock('$lib/server/dao/leave.dao.js', () => ({
	getApprovedRequestsInPeriod: vi.fn()
}));

vi.mock('$lib/server/dao/organization_location.dao.js', () => ({
	getLocationByCuid: vi.fn(),
	getAllLocations: vi.fn(),
	getLocations: vi.fn()
}));

vi.mock('$lib/server/dao/employment.dao.js', () => ({
	findByEmployeeCuid: vi.fn(),
	list: vi.fn()
}));

vi.mock('$lib/server/dao/employee.dao.js', () => ({
	findByCuid2: vi.fn()
}));

vi.mock('$lib/server/dao/holiday.dao.js', () => ({
	findByDate: vi.fn()
}));

vi.mock('$lib/server/dao/master-data.dao.js', () => ({
	findAttendanceSourceByName: vi.fn(),
	createAttendanceSource: vi.fn(),
	findByCuid2: vi.fn()
}));

vi.mock('$lib/server/dao/attendance.dao.js', () => {
	return {
		findByEmployeeAndDate: vi.fn(),
		listByEmployee: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		findOpenRecord: vi.fn(),
		findOpenRecordOnDate: vi.fn(),
		findByCuid: vi.fn(),
		findPendingCheckOuts: vi.fn()
	};
});

vi.mock('$lib/server/services/audit.service.js', () => ({
	log: vi.fn().mockResolvedValue(undefined),
	logUpdate: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/server/db.js', () => ({
	db: {
		$transaction: vi.fn((cb) => cb({}))
	}
}));

describe('attendance service', () => {
	const employeeCuid = 'emp-uuid-123';
	const validGps = { latitude: 13.038734, longitude: 80.234665 }; // Very close to office coordinates
	const invalidGps = { latitude: 12.0, longitude: 79.0 }; // Far away

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(Date.UTC(2026, 5, 1, 9, 0, 0))); // June 1, 2026 09:00 UTC (Monday)
		vi.clearAllMocks();
		vi.mocked(leaveDao.getApprovedRequestsInPeriod).mockResolvedValue([]);
		vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
			date_of_joining: new Date(Date.UTC(2026, 0, 1)), // Jan 1, 2026
			relieving_date: null,
			location_cuid: 'location-uuid-123'
		} as any);
		vi.mocked(locationDao.getLocationByCuid).mockResolvedValue({
			cuid: 'location-uuid-123',
			latitude: 13.038734640855532,
			longitude: 80.2346649817288
		} as any);
		vi.mocked(attendanceDao.findOpenRecord).mockResolvedValue(null);
		vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue(null);
		vi.mocked(attendanceDao.findByCuid).mockResolvedValue(null);
		vi.mocked(attendanceDao.findPendingCheckOuts).mockResolvedValue([]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('checkIn', () => {
		it('should reject if employeeCuid is missing', async () => {
			await expect(checkIn('', null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Employee is required')
			);
		});

		it('should reject if employee does not exist', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue(null);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Selected employee does not exist')
			);
		});

		it('should reject if check-in is on a holiday', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue({ id: 1n, name: 'New Year' } as any);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on holidays')
			);
		});

		it('should reject if employee is already checked in for today', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'existing-rec', status: 'Present', check_in_time: new Date() } as any);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Already checked in for today')
			);
		});

		it('should reject if an open attendance record already exists for today', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({ cuid: 'existing-open-rec', status: 'Present' } as any);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'An open attendance record already exists for today. Please check out first.')
			);
		});

		it('should reject if check-in is on a leave or LOP day', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);

			// Leave status check
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'existing-rec', status: 'Leave' } as any);
			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);

			// LOP status check
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'existing-rec', status: 'LOP' } as any);
			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);
		});

		it('should reject if gps coordinates are missing or invalid', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);

			await expect(checkIn(employeeCuid, null, null, null)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'GPS coordinates are required to mark attendance')
			);

			await expect(checkIn(employeeCuid, null, null, { latitude: NaN, longitude: 0 })).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'GPS coordinates are required to mark attendance')
			);
		});

		it('should reject if employee is outside the allowed geofence radius', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);

			await expect(checkIn(employeeCuid, null, null, invalidGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'You are outside the office zone')
			);
		});

		it('should reject if employee has no location_cuid assigned', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
				date_of_joining: new Date(Date.UTC(2026, 0, 1)),
				relieving_date: null,
				location_cuid: null
			} as any);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'No company location has been assigned')
			);
		});

		it('should reject if company location has no valid coordinates configured', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
				date_of_joining: new Date(Date.UTC(2026, 0, 1)),
				relieving_date: null,
				location_cuid: 'location-uuid-123'
			} as any);
			vi.mocked(locationDao.getLocationByCuid).mockResolvedValue({
				cuid: 'location-uuid-123',
				latitude: null,
				longitude: null
			} as any);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Company location is not properly configured')
			);
		});

		it('should reject if selected source does not exist', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue(null);

			await expect(checkIn(employeeCuid, 'invalid-source-cuid', null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('attendance_source_cuid', 'Selected source does not exist')
			);
		});

		it('should successfully check in using specified source', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-123', name: 'Mobile' } as any);
			vi.mocked(attendanceDao.create).mockResolvedValue({ cuid: 'created-attendance' } as any);

			const result = await checkIn(employeeCuid, 'source-123', 'admin', validGps);
			expect(result).toEqual({ cuid: 'created-attendance' });
			expect(attendanceDao.create).toHaveBeenCalledWith({
				employee_cuid: employeeCuid,
				date: new Date(Date.UTC(2026, 5, 1)),
				check_in_time: new Date(Date.UTC(2026, 5, 1, 9, 0, 0)),
				status: 'Present',
				attendance_source_cuid: 'source-123',
				created_by: 'admin',
				updated_by: 'admin',
				check_in_latitude: validGps.latitude,
				check_in_longitude: validGps.longitude
			});
		});

		it('should auto-create Web source if not specified', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findAttendanceSourceByName).mockResolvedValue(null);
			vi.mocked(masterDataDao.createAttendanceSource).mockResolvedValue({ cuid: 'web-source-cuid' } as any);
			vi.mocked(attendanceDao.create).mockResolvedValue({ cuid: 'created-attendance' } as any);

			await checkIn(employeeCuid, null, 'admin', validGps);
			expect(masterDataDao.createAttendanceSource).toHaveBeenCalledWith('Web');
		});

		it('should allow check-in on weekends', async () => {
			vi.setSystemTime(new Date(Date.UTC(2026, 5, 6, 9, 0, 0))); // June 6, 2026 (Saturday)
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findAttendanceSourceByName).mockResolvedValue(null);
			vi.mocked(masterDataDao.createAttendanceSource).mockResolvedValue({ cuid: 'web-source-cuid' } as any);
			vi.mocked(attendanceDao.create).mockResolvedValue({ cuid: 'created-attendance' } as any);

			const result = await checkIn(employeeCuid, null, 'admin', validGps);
			expect(result).toEqual({ cuid: 'created-attendance' });
		});

		it('should allow check-in on half-day leaves', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(leaveDao.getApprovedRequestsInPeriod).mockResolvedValue([{ is_half_day: true } as any]);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'existing-half-day', status: 'Half Day', check_in_time: null } as any);
			vi.mocked(attendanceDao.update).mockResolvedValue({ cuid: 'updated-attendance' } as any);

			const result = await checkIn(employeeCuid, null, 'admin', validGps);
			expect(result).toEqual({ cuid: 'updated-attendance' });
		});

		it('should reject check-in on approved full-day leaves', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(leaveDao.getApprovedRequestsInPeriod).mockResolvedValue([{ is_half_day: false } as any]);

			await expect(checkIn(employeeCuid, null, 'admin', validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);
		});
	});

	describe('checkOut', () => {
		it('should reject if employeeCuid is missing', async () => {
			await expect(checkOut('', null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Employee is required')
			);
		});

		it('should reject if check-out is on a holiday', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue({ id: 1n, name: 'New Year' } as any);

			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on holidays')
			);
		});

		it('should reject if no open check-in record exists', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue(null);

			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'No open check-in record found')
			);
		});

		it('should reject if check-out is on a leave or LOP day', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);

			// Leave status check
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-1',
				status: 'Leave',
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);
			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);

			// LOP status check
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-1',
				status: 'LOP',
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);
			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);
		});

		it('should reject if gps is invalid or outside office zone', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-1',
				check_in_time: new Date(Date.UTC(2026, 5, 1, 9, 0, 0)),
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);

			await expect(checkOut(employeeCuid, null, invalidGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'You are outside the office zone')
			);
		});

		it('should reject if employee has no location_cuid assigned on check-out', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-123',
				check_in_time: new Date(),
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);
			vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
				date_of_joining: new Date(Date.UTC(2026, 0, 1)),
				relieving_date: null,
				location_cuid: null
			} as any);

			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'No company location has been assigned')
			);
		});

		it('should reject if company location has no valid coordinates configured on check-out', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-123',
				check_in_time: new Date(),
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);
			vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
				date_of_joining: new Date(Date.UTC(2026, 0, 1)),
				relieving_date: null,
				location_cuid: 'location-uuid-123'
			} as any);
			vi.mocked(locationDao.getLocationByCuid).mockResolvedValue({
				cuid: 'location-uuid-123',
				latitude: null,
				longitude: null
			} as any);

			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Company location is not properly configured')
			);
		});

		it('should successfully check out and calculate duration', async () => {
			const checkInTime = new Date(Date.UTC(2026, 5, 1, 9, 0, 0)); // 9:00 AM
			const checkOutTime = new Date(Date.UTC(2026, 5, 1, 17, 30, 0)); // 5:30 PM (8.5 hours / 510 minutes later)

			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-123',
				check_in_time: checkInTime,
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);
			vi.mocked(attendanceDao.update).mockResolvedValue({ cuid: 'record-123', work_duration_minutes: 510 } as any);

			// Advance time to 5:30 PM
			vi.setSystemTime(checkOutTime);

			const result = await checkOut(employeeCuid, 'admin', validGps);
			expect(result).toEqual({ cuid: 'record-123', work_duration_minutes: 510 });
			expect(attendanceDao.update).toHaveBeenCalledWith('record-123', {
				check_out_time: checkOutTime,
				work_duration_minutes: 510,
				updated_by: 'admin',
				updated_at: checkOutTime,
				check_out_latitude: validGps.latitude,
				check_out_longitude: validGps.longitude
			});
		});

		it('should allow check-out on weekends', async () => {
			vi.setSystemTime(new Date(Date.UTC(2026, 5, 6, 17, 30, 0))); // June 6, 2026 (Saturday)
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-123',
				check_in_time: new Date(Date.UTC(2026, 5, 6, 9, 0, 0)),
				date: new Date(Date.UTC(2026, 5, 6))
			} as any);
			vi.mocked(attendanceDao.update).mockResolvedValue({ cuid: 'record-123' } as any);

			const result = await checkOut(employeeCuid, 'admin', validGps);
			expect(result).toEqual({ cuid: 'record-123' });
		});

		it('should allow check-out on half-day leaves', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(leaveDao.getApprovedRequestsInPeriod).mockResolvedValue([{ is_half_day: true } as any]);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-123',
				check_in_time: new Date(Date.UTC(2026, 5, 1, 9, 0, 0)),
				status: 'Half Day',
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);
			vi.mocked(attendanceDao.update).mockResolvedValue({ cuid: 'record-123' } as any);

			const result = await checkOut(employeeCuid, 'admin', validGps);
			expect(result).toEqual({ cuid: 'record-123' });
		});

		it('should reject check-out on approved full-day leaves', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(leaveDao.getApprovedRequestsInPeriod).mockResolvedValue([{ is_half_day: false } as any]);
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue({
				cuid: 'record-123',
				check_in_time: new Date(Date.UTC(2026, 5, 1, 9, 0, 0)),
				date: new Date(Date.UTC(2026, 5, 1))
			} as any);

			await expect(checkOut(employeeCuid, 'admin', validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);
		});
	});

	describe('retrieval', () => {
		it('should retrieve history', async () => {
			vi.mocked(attendanceDao.listByEmployee).mockResolvedValue([{ cuid: 'rec-1' }] as any);
			const result = await getEmployeeHistory(employeeCuid);
			expect(result).toEqual([{ cuid: 'rec-1' }]);
			expect(attendanceDao.listByEmployee).toHaveBeenCalledWith(employeeCuid, expect.any(Date), expect.any(Date));
		});

		it('should retrieve history with default far-future endDate when no relieving_date is set', async () => {
			vi.mocked(attendanceDao.listByEmployee).mockResolvedValue([{ cuid: 'rec-1' }] as any);
			await getEmployeeHistory(employeeCuid);
			expect(attendanceDao.listByEmployee).toHaveBeenCalledWith(
				employeeCuid,
				expect.any(Date),
				new Date(Date.UTC(2099, 11, 31))
			);
		});

		it('should reject retrieval without employeeCuid', async () => {
			await expect(getEmployeeHistory('')).rejects.toThrow('Employee CUID is required');
			await expect(getTodayStatus('')).rejects.toThrow('Employee CUID is required');
		});

		it('should retrieve today status', async () => {
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'today-rec' } as any);
			const result = await getTodayStatus(employeeCuid);
			expect(result).toEqual({ cuid: 'today-rec' });
		});
	});

	describe('pending check-outs and daily check-in enhancements', () => {
		it('should allow next-day check-in even if previous day check-out is missing', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			// Mock no open record TODAY, even if there's one globally (which is ignored by checkIn now)
			vi.mocked(attendanceDao.findOpenRecordOnDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.create).mockResolvedValue({ cuid: 'new-day-attendance' } as any);

			const result = await checkIn(employeeCuid, null, 'admin', validGps);
			expect(result).toEqual({ cuid: 'new-day-attendance' });
		});

		it('should retrieve pending check-out records', async () => {
			const mockPending = [
				{ cuid: 'rec-1', date: new Date(Date.UTC(2026, 5, 1)), check_in_time: new Date(), status: 'Present' }
			];
			vi.mocked(attendanceDao.findPendingCheckOuts).mockResolvedValue(mockPending as any);

			const result = await getPendingCheckOuts(employeeCuid);
			expect(result).toEqual([
				{
					cuid: 'rec-1',
					date: '2026-06-01',
					check_in_time: expect.any(String),
					status: 'Present'
				}
			]);
		});

		it('should successfully check out a specific pending record within 7 days when check-out time is provided', async () => {
			const checkInTime = new Date(Date.UTC(2026, 5, 1, 9, 0, 0)); // June 1, 9:00 AM
			const recordDate = new Date(Date.UTC(2026, 5, 1));
			const checkOutTime = new Date(Date.UTC(2026, 5, 1, 17, 0, 0)); // June 1, 5:00 PM (8 hours later)
			
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByCuid).mockResolvedValue({
				cuid: 'target-record-cuid',
				employee_cuid: employeeCuid,
				date: recordDate,
				check_in_time: checkInTime,
				check_out_time: null,
				status: 'Present'
			} as any);
			vi.mocked(attendanceDao.update).mockResolvedValue({ cuid: 'target-record-cuid' } as any);

			const result = await checkOut(employeeCuid, 'admin', validGps, 'target-record-cuid', checkOutTime);
			expect(result).toEqual({ cuid: 'target-record-cuid' });
			expect(attendanceDao.update).toHaveBeenCalledWith('target-record-cuid', expect.objectContaining({
				check_out_time: checkOutTime,
				work_duration_minutes: 480
			}));
		});

		it('should reject pending check-out if check-out time is not provided', async () => {
			const recordDate = new Date(Date.UTC(2026, 5, 1));
			vi.mocked(attendanceDao.findByCuid).mockResolvedValue({
				cuid: 'target-record-cuid',
				employee_cuid: employeeCuid,
				date: recordDate,
				check_in_time: new Date(),
				check_out_time: null
			} as any);

			await expect(checkOut(employeeCuid, 'admin', validGps, 'target-record-cuid', null)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Check-out time is required for pending check-out')
			);
		});

		it('should reject pending check-out if check-out time is equal to check-in time', async () => {
			const checkInTime = new Date(Date.UTC(2026, 5, 1, 9, 0, 0));
			const recordDate = new Date(Date.UTC(2026, 5, 1));
			vi.mocked(attendanceDao.findByCuid).mockResolvedValue({
				cuid: 'target-record-cuid',
				employee_cuid: employeeCuid,
				date: recordDate,
				check_in_time: checkInTime,
				check_out_time: null
			} as any);

			await expect(checkOut(employeeCuid, 'admin', validGps, 'target-record-cuid', checkInTime)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Check-out time must be later than check-in time')
			);
		});

		it('should reject pending check-out if check-out time is earlier than check-in time', async () => {
			const checkInTime = new Date(Date.UTC(2026, 5, 1, 9, 0, 0));
			const recordDate = new Date(Date.UTC(2026, 5, 1));
			const checkOutTime = new Date(Date.UTC(2026, 5, 1, 8, 59, 0));
			vi.mocked(attendanceDao.findByCuid).mockResolvedValue({
				cuid: 'target-record-cuid',
				employee_cuid: employeeCuid,
				date: recordDate,
				check_in_time: checkInTime,
				check_out_time: null
			} as any);

			await expect(checkOut(employeeCuid, 'admin', validGps, 'target-record-cuid', checkOutTime)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Check-out time must be later than check-in time')
			);
		});

		it('should reject checking out a specific pending record if it belongs to another employee', async () => {
			vi.mocked(attendanceDao.findByCuid).mockResolvedValue({
				cuid: 'target-record-cuid',
				employee_cuid: 'different-employee-cuid',
				check_out_time: null,
				date: new Date()
			} as any);

			await expect(checkOut(employeeCuid, 'admin', validGps, 'target-record-cuid', new Date())).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Selected attendance record does not belong to the authenticated employee')
			);
		});

		it('should reject checking out a specific pending record if it is older than 7 days', async () => {
			// Mock record from 8 days ago
			const recordDate = new Date(Date.UTC(2026, 4, 24)); // May 24, 2026 (System time is June 1, 2026)
			vi.mocked(attendanceDao.findByCuid).mockResolvedValue({
				cuid: 'target-record-cuid',
				employee_cuid: employeeCuid,
				date: recordDate,
				check_in_time: new Date(),
				check_out_time: null,
				status: 'Present'
			} as any);

			await expect(checkOut(employeeCuid, 'admin', validGps, 'target-record-cuid', new Date())).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Pending check-out has expired (grace period is 7 days)')
			);
		});

		it('should reject checking out a specific pending record if it is already checked out', async () => {
			vi.mocked(attendanceDao.findByCuid).mockResolvedValue({
				cuid: 'target-record-cuid',
				employee_cuid: employeeCuid,
				check_in_time: new Date(),
				check_out_time: new Date(),
				status: 'Present'
			} as any);

			await expect(checkOut(employeeCuid, 'admin', validGps, 'target-record-cuid', new Date())).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Selected attendance record is already checked out')
			);
		});
	});
});
