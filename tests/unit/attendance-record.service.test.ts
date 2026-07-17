import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as attendanceRecordDao from '$lib/server/dao/attendance-record.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';
import {
	createAttendanceRecord,
	updateAttendanceRecord,
	listAttendanceRecords,
	getAttendanceRecordByCuid,
	AttendanceValidationError,
	AttendanceMultiValidationError
} from '$lib/server/services/attendance-record.service.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as leaveDao from '$lib/server/dao/leave.dao.js';

vi.mock('$lib/server/dao/leave.dao.js', () => ({
	getApprovedRequestsInPeriod: vi.fn()
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
	findByCuid2: vi.fn()
}));

vi.mock('$lib/server/dao/attendance-record.dao.js', () => {
	return {
		list: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		findByCuid: vi.fn(),
		findByEmployeeAndDate: vi.fn()
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

describe('attendance-record service', () => {
	const employeeCuid = 'emp-123';
	const validRecordInput = {
		employee_cuid: employeeCuid,
		date: '2026-06-01',
		check_in_time: '2026-06-01T09:00:00Z',
		check_out_time: '2026-06-01T17:00:00Z',
		status: 'Present',
		attendance_source_cuid: 'source-1',
		remarks: 'Ok'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(leaveDao.getApprovedRequestsInPeriod).mockResolvedValue([]);
		vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-1', name: 'Web' } as any);
		vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
			date_of_joining: new Date(Date.UTC(2026, 0, 1)), // Jan 1, 2026
			relieving_date: null
		} as any);
		vi.mocked(employmentDao.list).mockResolvedValue([
			{
				employee_cuid: employeeCuid,
				date_of_joining: new Date(Date.UTC(2026, 0, 1)), // Jan 1, 2026
				relieving_date: null
			}
		] as any);
	});

	describe('creation and validation', () => {
		it('should reject if employee does not exist', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue(null);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ employee_cuid: 'Selected employee does not exist' })
			);
		});

		it('should reject for invalid date formats', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);

			await expect(
				createAttendanceRecord({
					...validRecordInput,
					date: 'invalid-date'
				})
			).rejects.toThrowError(
				new AttendanceMultiValidationError({ date: 'Attendance date must be a valid date' })
			);
		});

		it('should reject if date is a holiday', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue({ id: 1n } as any);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ date: 'Attendance cannot be marked on holidays' })
			);
		});

		it('should reject if source does not exist', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue(null);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ attendance_source_cuid: 'Selected attendance source does not exist' })
			);
		});

		it('should accept check-out time earlier in the day than check-in time by adjusting it to next day (cross-midnight)', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-1' } as any);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(attendanceRecordDao.create).mockResolvedValue({ cuid: 'created-rec-cross' } as any);

			const result = await createAttendanceRecord({
				...validRecordInput,
				check_in_time: '2026-06-01T20:00:00Z',
				check_out_time: '2026-06-01T06:00:00Z'
			});
			expect(result).toEqual({ cuid: 'created-rec-cross' });
			expect(attendanceRecordDao.create).toHaveBeenCalledWith(expect.objectContaining({
				check_in_time: new Date('2026-06-01T20:00:00Z'),
				check_out_time: new Date('2026-06-02T06:00:00Z'),
				work_duration_minutes: 600
			}));
		});

		it('should reject check-out time that is genuinely before check-in time even after cross-midnight adjustment', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-1' } as any);

			await expect(
				createAttendanceRecord({
					...validRecordInput,
					check_in_time: '2026-06-03T10:00:00Z',
					check_out_time: '2026-06-01T09:00:00Z'
				})
			).rejects.toThrowError(
				new AttendanceMultiValidationError({ check_out_time: 'Check out time cannot be before check in time' })
			);
		});

		it('should reject duplicate record for employee on same date', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-1' } as any);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'existing-cuid' } as any);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ date: 'An attendance record already exists for this employee on this date' })
			);
		});

		it('should reject check-in, check-out, or source for non-working statuses (Leave, Holiday, LOP)', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-1' } as any);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue(null);

			await expect(
				createAttendanceRecord({
					...validRecordInput,
					status: 'Leave'
				})
			).rejects.toThrowError(
				new AttendanceMultiValidationError({
					check_in_time: 'Check-in and check-out times must be removed for non-working statuses',
					check_out_time: 'Check-in and check-out times must be removed for non-working statuses',
					attendance_source_cuid: 'Attendance source must be removed for non-working statuses'
				})
			);

			await expect(
				createAttendanceRecord({
					...validRecordInput,
					status: 'LOP'
				})
			).rejects.toThrowError(
				new AttendanceMultiValidationError({
					check_in_time: 'Check-in and check-out times must be removed for non-working statuses',
					check_out_time: 'Check-in and check-out times must be removed for non-working statuses',
					attendance_source_cuid: 'Attendance source must be removed for non-working statuses'
				})
			);
		});

		it('should successfully create record and calculate duration', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ cuid: 'source-1' } as any);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(attendanceRecordDao.create).mockResolvedValue({ cuid: 'created-rec-1' } as any);

			const result = await createAttendanceRecord(validRecordInput);
			expect(result).toEqual({ cuid: 'created-rec-1' });
			expect(attendanceRecordDao.create).toHaveBeenCalledWith({
				employee_cuid: employeeCuid,
				date: new Date(Date.UTC(2026, 5, 1)),
				check_in_time: new Date('2026-06-01T09:00:00Z'),
				check_out_time: new Date('2026-06-01T17:00:00Z'),
				work_duration_minutes: 480, // 8 hours = 480 minutes
				status: 'Present',
				attendance_source_cuid: 'source-1',
				remarks: 'Ok',
				created_by: undefined,
				updated_by: undefined
			});
		});
	});

	describe('updates', () => {
		const targetCuid = 'record-cuid-123';

		it('should throw error if CUID is missing', async () => {
			await expect(updateAttendanceRecord('', {})).rejects.toThrow('Attendance Record CUID is required for updates');
		});

		it('should successfully update record', async () => {
			vi.mocked(attendanceRecordDao.findByCuid).mockResolvedValue({
				cuid: targetCuid,
				employee_cuid: employeeCuid,
				date: new Date(Date.UTC(2026, 5, 1)),
				check_in_time: new Date('2026-06-01T09:00:00Z')
			} as any);
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(attendanceRecordDao.update).mockResolvedValue({ cuid: targetCuid } as any);

			const result = await updateAttendanceRecord(targetCuid, {
				check_out_time: '2026-06-01T17:00:00Z'
			});
			expect(result).toEqual({ cuid: targetCuid });
			expect(attendanceRecordDao.update).toHaveBeenCalledWith(targetCuid, expect.objectContaining({
				check_out_time: new Date('2026-06-01T17:00:00Z'),
				work_duration_minutes: 480
			}));
		});

		it('should successfully update record with cross-midnight times', async () => {
			vi.mocked(attendanceRecordDao.findByCuid).mockResolvedValue({
				cuid: targetCuid,
				employee_cuid: employeeCuid,
				date: new Date(Date.UTC(2026, 5, 1)),
				check_in_time: new Date('2026-06-01T20:00:00Z'),
				check_out_time: null
			} as any);
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(attendanceRecordDao.update).mockResolvedValue({ cuid: targetCuid } as any);

			const result = await updateAttendanceRecord(targetCuid, {
				check_out_time: '2026-06-01T06:00:00Z'
			});
			expect(result).toEqual({ cuid: targetCuid });
			expect(attendanceRecordDao.update).toHaveBeenCalledWith(targetCuid, expect.objectContaining({
				check_in_time: new Date('2026-06-01T20:00:00Z'),
				check_out_time: new Date('2026-06-02T06:00:00Z'),
				work_duration_minutes: 600
			}));
		});
	});

	describe('retrieval', () => {
		it('should list records with parsed date filter', async () => {
			const expectedRecord = { cuid: 'rec', employee_cuid: employeeCuid, date: new Date(Date.UTC(2026, 5, 1)) };
			vi.mocked(attendanceRecordDao.list).mockResolvedValue([expectedRecord] as any);

			const result = await listAttendanceRecords({ date: '2026-06-01' });
			expect(result).toEqual([expectedRecord]);
			expect(attendanceRecordDao.list).toHaveBeenCalledWith({
				date: new Date(Date.UTC(2026, 5, 1))
			});
		});

		it('should fetch record by CUID', async () => {
			vi.mocked(attendanceRecordDao.findByCuid).mockResolvedValue({ cuid: 'rec-1' } as any);

			const result = await getAttendanceRecordByCuid('c1');
			expect(result).toEqual({ cuid: 'rec-1' });
		});
	});
});
