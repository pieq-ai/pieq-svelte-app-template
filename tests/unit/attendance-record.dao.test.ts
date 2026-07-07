import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	list,
	findByCuid,
	findByEmployeeAndDate,
	create,
	update
} from '$lib/server/dao/attendance-record.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			attendanceRecord: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				findFirst: vi.fn(),
				create: vi.fn(),
				update: vi.fn()
			}
		}
	};
});

describe('attendance-record DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it('should list all records with parsed where conditions', async () => {
			const date = new Date();
			const mockList = [{ id: 1n, cuid: 'rec-1' }];
			vi.mocked(db.attendanceRecord.findMany).mockResolvedValue(mockList as any);

			const result = await list({
				employee_cuid: 'emp-1',
				date,
				status: 'Present',
				attendance_source_cuid: 'source-1'
			});

			expect(result).toBe(mockList);
			expect(db.attendanceRecord.findMany).toHaveBeenCalledWith({
				where: {
					employee_cuid: 'emp-1',
					date,
					status: 'Present',
					attendance_source_cuid: 'source-1'
				},
				orderBy: [
					{ date: 'desc' },
					{ created_at: 'desc' }
				]
			});
		});
	});

	describe('findByCuid', () => {
		it('should find record by CUID', async () => {
			const mockRecord = { id: 1n, cuid: 'c1' };
			vi.mocked(db.attendanceRecord.findUnique).mockResolvedValue(mockRecord as any);

			const result = await findByCuid('c1');
			expect(result).toBe(mockRecord);
			expect(db.attendanceRecord.findUnique).toHaveBeenCalledWith({
				where: { cuid: 'c1' }
			});
		});
	});

	describe('findByEmployeeAndDate', () => {
		it('should find record by employee and date', async () => {
			const date = new Date();
			const mockRecord = { id: 1n, cuid: 'c1' };
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
	});

	describe('create', () => {
		it('should create attendance record with appropriate schema mappings', async () => {
			const input = {
				employee_cuid: 'emp-1',
				date: new Date(),
				check_in_time: new Date(),
				check_out_time: new Date(),
				work_duration_minutes: 480,
				status: 'Present',
				attendance_source_cuid: 'source-1',
				remarks: 'Good'
			};
			vi.mocked(db.attendanceRecord.create).mockResolvedValue({ id: 1n } as any);

			await create(input);
			expect(db.attendanceRecord.create).toHaveBeenCalledWith({
				data: {
					employee_cuid: 'emp-1',
					date: input.date,
					check_in_time: input.check_in_time,
					check_out_time: input.check_out_time,
					work_duration_minutes: 480,
					status: 'Present',
					attendance_source_cuid: 'source-1',
					remarks: 'Good',
					created_by: null,
					updated_by: null
				}
			});
		});
	});

	describe('update', () => {
		it('should update record with direct generic inputs on update', async () => {
			const input = {
				date: new Date(),
				status: 'LOP'
			};
			vi.mocked(db.attendanceRecord.update).mockResolvedValue({ id: 1n } as any);

			await update('c1', input);
			expect(db.attendanceRecord.update).toHaveBeenCalledWith({
				where: { cuid: 'c1' },
				data: {
					date: input.date,
					status: 'LOP'
				}
			});
		});
	});

});
