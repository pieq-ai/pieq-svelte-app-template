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
	AttendanceValidationError
} from '$lib/server/services/attendance.service.js';

vi.mock('$lib/server/dao/employee.dao.js', () => ({
	findUniqueByUuid: vi.fn()
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
		update: vi.fn()
	};
});

describe('attendance service', () => {
	const employeeCuid = 'emp-uuid-123';
	const validGps = { latitude: 13.038734, longitude: 80.234665 }; // Very close to office coordinates
	const invalidGps = { latitude: 12.0, longitude: 79.0 }; // Far away

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(Date.UTC(2026, 5, 1, 9, 0, 0))); // June 1, 2026 09:00 UTC (Monday)
		vi.clearAllMocks();
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
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue(null);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Selected employee does not exist')
			);
		});

		it('should reject if check-in is on a holiday', async () => {
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue({ id: 1n, name: 'New Year' } as any);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on holidays')
			);
		});

		it('should reject if employee is already checked in for today', async () => {
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'existing-rec', status: 'Present' } as any);

			await expect(checkIn(employeeCuid, null, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Already checked in for today')
			);
		});

		it('should reject if check-in is on a leave or LOP day', async () => {
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
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
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
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
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);

			await expect(checkIn(employeeCuid, null, null, invalidGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'You are outside the office zone')
			);
		});

		it('should reject if selected source does not exist', async () => {
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue(null);

			await expect(checkIn(employeeCuid, 'invalid-source-cuid', null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('attendance_source_cuid', 'Selected source does not exist')
			);
		});

		it('should successfully check in using specified source', async () => {
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-123', attendance_source_name: 'Mobile' } as any);
			vi.mocked(attendanceDao.create).mockResolvedValue({ cuid: 'created-attendance' } as any);

			const result = await checkIn(employeeCuid, 'source-123', 'admin', validGps);
			expect(result).toEqual({ cuid: 'created-attendance' });
			expect(attendanceDao.create).toHaveBeenCalledWith({
				employee_cuid: employeeCuid,
				attendance_date: new Date(Date.UTC(2026, 5, 1)),
				check_in_time: new Date(Date.UTC(2026, 5, 1, 9, 0, 0)),
				attendance_status: 'Present',
				attendance_source_cuid: 'source-123',
				created_by: 'admin',
				updated_by: 'admin',
				check_in_latitude: validGps.latitude,
				check_in_longitude: validGps.longitude
			});
		});

		it('should auto-create Web source if not specified', async () => {
			vi.mocked(employeeDao.findUniqueByUuid).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findAttendanceSourceByName).mockResolvedValue(null);
			vi.mocked(masterDataDao.createAttendanceSource).mockResolvedValue({ cuid: 'web-source-cuid' } as any);
			vi.mocked(attendanceDao.create).mockResolvedValue({ cuid: 'created-attendance' } as any);

			await checkIn(employeeCuid, null, 'admin', validGps);
			expect(masterDataDao.createAttendanceSource).toHaveBeenCalledWith('Web');
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

		it('should reject if no check-in record exists for today', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue(null);

			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'No check-in record found for today')
			);
		});

		it('should reject if already checked out today', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({
				cuid: 'record-1',
				status: 'Present',
				check_in_time: new Date(Date.UTC(2026, 5, 1, 9, 0, 0)),
				check_out_time: new Date(Date.UTC(2026, 5, 1, 17, 0, 0))
			} as any);

			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Already checked out for today')
			);
		});

		it('should reject if check-out is on a leave or LOP day', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);

			// Leave status check
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({
				cuid: 'record-1',
				status: 'Leave'
			} as any);
			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);

			// LOP status check
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({
				cuid: 'record-1',
				status: 'LOP'
			} as any);
			await expect(checkOut(employeeCuid, null, validGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'Attendance cannot be marked on leave or LOP days')
			);
		});

		it('should reject if gps is invalid or outside office zone', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({
				cuid: 'record-1',
				check_in_time: new Date(Date.UTC(2026, 5, 1, 9, 0, 0))
			} as any);

			await expect(checkOut(employeeCuid, null, invalidGps)).rejects.toThrowError(
				new AttendanceValidationError('employee_cuid', 'You are outside the office zone')
			);
		});

		it('should successfully check out and calculate duration', async () => {
			const checkInTime = new Date(Date.UTC(2026, 5, 1, 9, 0, 0)); // 9:00 AM
			const checkOutTime = new Date(Date.UTC(2026, 5, 1, 17, 30, 0)); // 5:30 PM (8.5 hours / 510 minutes later)

			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceDao.findByEmployeeAndDate).mockResolvedValue({
				cuid: 'record-123',
				check_in_time: checkInTime
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
	});

	describe('retrieval', () => {
		it('should retrieve history', async () => {
			vi.mocked(attendanceDao.listByEmployee).mockResolvedValue([{ cuid: 'rec-1' }] as any);
			const result = await getEmployeeHistory(employeeCuid);
			expect(result).toEqual([{ cuid: 'rec-1' }]);
			expect(attendanceDao.listByEmployee).toHaveBeenCalledWith(employeeCuid);
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
});
