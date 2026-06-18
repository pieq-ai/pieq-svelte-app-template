import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '$lib/server/db.js';
import * as attendanceRecordDao from '$lib/server/dao/attendance-record.dao.js';
import {
	createAttendanceRecord,
	updateAttendanceRecord,
	deleteAttendanceRecord,
	listAttendanceRecords,
	getAttendanceRecordByCuid,
	AttendanceValidationError,
	AttendanceMultiValidationError
} from '$lib/server/services/attendance-record.service.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			employee: {
				findUnique: vi.fn()
			},
			holidayCalendar: {
				findFirst: vi.fn()
			},
			attendanceSource: {
				findUnique: vi.fn()
			},
			attendanceRecord: {
				findUnique: vi.fn()
			}
		}
	};
});

vi.mock('$lib/server/dao/attendance-record.dao.js', () => {
	return {
		list: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deleteRecord: vi.fn(),
		findByCuid: vi.fn(),
		findByEmployeeAndDate: vi.fn()
	};
});

describe('attendance-record service', () => {
	const employeeCuid = 'emp-123';
	const validRecordInput = {
		employee_cuid: employeeCuid,
		attendance_date: '2026-06-01',
		check_in_time: '2026-06-01T09:00:00Z',
		check_out_time: '2026-06-01T17:00:00Z',
		attendance_status: 'Present',
		attendance_source_cuid: 'source-1',
		remarks: 'Ok'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.attendanceSource.findUnique).mockResolvedValue({ cuid: 'source-1', attendance_source_name: 'Web' } as any);
	});

	describe('creation and validation', () => {
		it('should reject if employee does not exist', async () => {
			vi.mocked(db.employee.findUnique).mockResolvedValue(null);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ employee_cuid: 'Selected employee does not exist' })
			);
		});

		it('should reject for invalid date formats', async () => {
			vi.mocked(db.employee.findUnique).mockResolvedValue({ uuid: employeeCuid } as any);

			await expect(
				createAttendanceRecord({
					...validRecordInput,
					attendance_date: 'invalid-date'
				})
			).rejects.toThrowError(
				new AttendanceMultiValidationError({ attendance_date: 'attendance date must be a valid date' })
			);
		});

		it('should reject if date is a holiday', async () => {
			vi.mocked(db.employee.findUnique).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue({ id: 1n } as any);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ attendance_date: 'Attendance cannot be marked on holidays' })
			);
		});

		it('should reject if source does not exist', async () => {
			vi.mocked(db.employee.findUnique).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue(null);
			vi.mocked(db.attendanceSource.findUnique).mockResolvedValue(null);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ attendance_source_cuid: 'Selected attendance source does not exist' })
			);
		});

		it('should reject check-out time before check-in time', async () => {
			vi.mocked(db.employee.findUnique).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue(null);
			vi.mocked(db.attendanceSource.findUnique).mockResolvedValue({ cuid: 'source-1' } as any);

			await expect(
				createAttendanceRecord({
					...validRecordInput,
					check_in_time: '2026-06-01T17:00:00Z',
					check_out_time: '2026-06-01T09:00:00Z'
				})
			).rejects.toThrowError(
				new AttendanceMultiValidationError({ check_out_time: 'Check out time cannot be before check in time' })
			);
		});

		it('should reject duplicate record for employee on same date', async () => {
			vi.mocked(db.employee.findUnique).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue(null);
			vi.mocked(db.attendanceSource.findUnique).mockResolvedValue({ cuid: 'source-1' } as any);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue({ cuid: 'existing-cuid' } as any);

			await expect(createAttendanceRecord(validRecordInput)).rejects.toThrowError(
				new AttendanceMultiValidationError({ attendance_date: 'An attendance record already exists for this employee on this date' })
			);
		});

		it('should successfully create record and calculate duration', async () => {
			vi.mocked(db.employee.findUnique).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue(null);
			vi.mocked(db.attendanceSource.findUnique).mockResolvedValue({ cuid: 'source-1' } as any);
			vi.mocked(attendanceRecordDao.findByEmployeeAndDate).mockResolvedValue(null);
			vi.mocked(attendanceRecordDao.create).mockResolvedValue({ cuid: 'created-rec-1' } as any);

			const result = await createAttendanceRecord(validRecordInput);
			expect(result).toEqual({ cuid: 'created-rec-1' });
			expect(attendanceRecordDao.create).toHaveBeenCalledWith({
				employee_cuid: employeeCuid,
				attendance_date: new Date(Date.UTC(2026, 5, 1)),
				check_in_time: new Date('2026-06-01T09:00:00Z'),
				check_out_time: new Date('2026-06-01T17:00:00Z'),
				work_duration_minutes: 480, // 8 hours = 480 minutes
				attendance_status: 'Present',
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
			vi.mocked(db.employee.findUnique).mockResolvedValue({ uuid: employeeCuid } as any);
			vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue(null);
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
	});

	describe('retrieval and deletion', () => {
		it('should call deleteRecord from DAO', async () => {
			vi.mocked(attendanceRecordDao.deleteRecord).mockResolvedValue({ cuid: 'deleted-rec' } as any);

			const result = await deleteAttendanceRecord('cuid-1');
			expect(result).toEqual({ cuid: 'deleted-rec' });
			expect(attendanceRecordDao.deleteRecord).toHaveBeenCalledWith('cuid-1');
		});

		it('should fail delete without CUID', async () => {
			await expect(deleteAttendanceRecord('')).rejects.toThrow('Attendance Record CUID is required');
		});

		it('should list records with parsed date filter', async () => {
			vi.mocked(attendanceRecordDao.list).mockResolvedValue([{ cuid: 'rec' }] as any);

			const result = await listAttendanceRecords({ attendance_date: '2026-06-01' });
			expect(result).toEqual([{ cuid: 'rec' }]);
			expect(attendanceRecordDao.list).toHaveBeenCalledWith({
				attendance_date: new Date(Date.UTC(2026, 5, 1))
			});
		});

		it('should fetch record by CUID', async () => {
			vi.mocked(attendanceRecordDao.findByCuid).mockResolvedValue({ cuid: 'rec-1' } as any);

			const result = await getAttendanceRecordByCuid('c1');
			expect(result).toEqual({ cuid: 'rec-1' });
		});
	});
});
