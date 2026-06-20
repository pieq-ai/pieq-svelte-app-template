import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	findByEmployeeAndDate,
	listByEmployee,
	create,
	update
} from '$lib/server/dao/attendance.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			attendanceRecord: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
				create: vi.fn(),
				update: vi.fn()
			}
		}
	};
});

describe('attendance DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should find record by employee CUID and date', async () => {
		const date = new Date();
		const mockRecord = { id: 1n, employee_cuid: 'emp-1', date };
		vi.mocked(db.attendanceRecord.findFirst).mockResolvedValue(mockRecord as any);

		const result = await findByEmployeeAndDate('emp-1', date);
		expect(result).toBe(mockRecord);
		expect(db.attendanceRecord.findFirst).toHaveBeenCalledWith({
			where: {
				employee_cuid: 'emp-1',
				date
			}
		});
	});

	it('should list all attendance records for employee', async () => {
		const mockList = [{ id: 1n, employee_cuid: 'emp-1' }];
		vi.mocked(db.attendanceRecord.findMany).mockResolvedValue(mockList as any);

		const result = await listByEmployee('emp-1');
		expect(result).toBe(mockList);
		expect(db.attendanceRecord.findMany).toHaveBeenCalledWith({
			where: { employee_cuid: 'emp-1' },
			orderBy: [
				{ date: 'desc' },
				{ created_at: 'desc' }
			]
		});
	});

	it('should create attendance record with expected fields', async () => {
		const input = {
			employee_cuid: 'emp-1',
			date: new Date(),
			check_in_time: new Date(),
			check_out_time: null,
			work_duration_minutes: null,
			status: 'Present',
			attendance_source_cuid: 'source-1',
			remarks: 'Good',
			created_by: 'user-1',
			updated_by: 'user-1',
			check_in_latitude: 12.34,
			check_in_longitude: 56.78
		};

		vi.mocked(db.attendanceRecord.create).mockResolvedValue({ id: 1n, cuid: 'rec-1' } as any);

		const result = await create(input);
		expect(result).toEqual({ id: 1n, cuid: 'rec-1' });
		expect(db.attendanceRecord.create).toHaveBeenCalledWith({
			data: {
				employee_cuid: input.employee_cuid,
				date: input.date,
				check_in_time: input.check_in_time,
				check_out_time: null,
				work_duration_minutes: null,
				status: input.status,
				attendance_source_cuid: input.attendance_source_cuid,
				remarks: input.remarks,
				created_by: input.created_by,
				updated_by: input.updated_by,
				check_in_latitude: input.check_in_latitude,
				check_in_longitude: input.check_in_longitude
			}
		});
	});

	it('should update attendance record', async () => {
		const data = { work_duration_minutes: 480 };
		vi.mocked(db.attendanceRecord.update).mockResolvedValue({ id: 1n, cuid: 'rec-1', ...data } as any);

		const result = await update('rec-1', data);
		expect(result).toEqual({ id: 1n, cuid: 'rec-1', ...data });
		expect(db.attendanceRecord.update).toHaveBeenCalledWith({
			where: { cuid: 'rec-1' },
			data
		});
	});
});
