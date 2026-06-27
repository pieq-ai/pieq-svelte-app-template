import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as attendanceRecordService from '$lib/server/services/attendance-record.service.js';
import * as recordsApi from '../../src/routes/api/attendance-records/+server.js';
import * as recordsCuidApi from '../../src/routes/api/attendance-records/[cuid]/+server.js';

vi.mock('$lib/server/services/attendance-record.service.js', () => ({
	listAttendanceRecords: vi.fn(),
	getAttendanceRecordByCuid: vi.fn(),
	createAttendanceRecord: vi.fn(),
	updateAttendanceRecord: vi.fn(),
	AttendanceValidationError: class extends Error {
		field: string;
		constructor(field: string, msg: string) {
			super(msg);
			this.name = 'AttendanceValidationError';
			this.field = field;
		}
	},
	AttendanceMultiValidationError: class extends Error {
		fields: any;
		constructor(fields: any) {
			super('Validation failed');
			this.name = 'AttendanceMultiValidationError';
			this.fields = fields;
		}
	}
}));

describe('attendance-records API', () => {
	const mockLocals = {
		auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } })
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/attendance-records', () => {
		it('should list and format attendance records successfully', async () => {
			const mockList = [
				{
					cuid: 'rec-1',
					employee_cuid: 'emp-1',
					date: new Date('2026-06-01'),
					check_in_time: new Date('2026-06-01T09:00:00Z'),
					check_out_time: new Date('2026-06-01T17:00:00Z'),
					work_duration_minutes: 480,
					status: 'Present',
					attendance_source_cuid: 'src-1',
					remarks: 'Fine'
				}
			];

			vi.mocked(attendanceRecordService.listAttendanceRecords).mockResolvedValue(mockList as any);

			const mockUrl = new URL('http://localhost/api/attendance-records?employee_cuid=emp-1');
			const res = await recordsApi.GET({ url: mockUrl } as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data[0].cuid).toBe('rec-1');
			expect(body.data[0].date).toBe('2026-06-01');
		});
	});

	describe('POST /api/attendance-records', () => {
		it('should create attendance record successfully', async () => {
			const payload = {
				employee_cuid: 'emp-1',
				date: '2026-06-01',
				status: 'Present'
			};
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(attendanceRecordService.createAttendanceRecord).mockResolvedValue({ cuid: 'rec-123' } as any);

			const res = await recordsApi.POST(mockEvent as any);
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.data.cuid).toBe('rec-123');
		});

		it('should return 409 for duplicate record conflict error', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue({ employee_cuid: 'emp-1', date: '2026-06-01' })
				},
				locals: mockLocals
			};

			vi.mocked(attendanceRecordService.createAttendanceRecord).mockRejectedValue(
				new attendanceRecordService.AttendanceMultiValidationError({
					date: 'An attendance record already exists for this employee on this date'
				})
			);

			const res = await recordsApi.POST(mockEvent as any);
			expect(res.status).toBe(409);
		});
	});

	describe('GET /api/attendance-records/[cuid]', () => {
		it('should return 404 if not found', async () => {
			vi.mocked(attendanceRecordService.getAttendanceRecordByCuid).mockResolvedValue(null);
			const res = await recordsCuidApi.GET({ params: { cuid: 'r1' } } as any);
			expect(res.status).toBe(404);
		});

		it('should return record if found', async () => {
			const mockRecord = {
				cuid: 'r1',
				employee_cuid: 'emp-1',
				date: new Date('2026-06-01'),
				check_in_time: null,
				check_out_time: null,
				work_duration_minutes: null,
				status: 'LOP',
				attendance_source_cuid: null,
				remarks: null
			};
			vi.mocked(attendanceRecordService.getAttendanceRecordByCuid).mockResolvedValue(mockRecord as any);

			const res = await recordsCuidApi.GET({ params: { cuid: 'r1' } } as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data.cuid).toBe('r1');
		});
	});

	describe('PUT /api/attendance-records/[cuid]', () => {
		it('should update successfully', async () => {
			const mockEvent = {
				params: { cuid: 'r1' },
				request: {
					json: vi.fn().mockResolvedValue({ status: 'Present' })
				},
				locals: mockLocals
			};

			vi.mocked(attendanceRecordService.getAttendanceRecordByCuid).mockResolvedValue({ cuid: 'r1' } as any);
			vi.mocked(attendanceRecordService.updateAttendanceRecord).mockResolvedValue({ cuid: 'r1' } as any);

			const res = await recordsCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(200);
		});

		it('should return 404 if attendance record to update is not found', async () => {
			const mockEvent = {
				params: { cuid: 'r1' },
				request: {
					json: vi.fn().mockResolvedValue({ status: 'Present' })
				},
				locals: mockLocals
			};

			vi.mocked(attendanceRecordService.getAttendanceRecordByCuid).mockResolvedValue(null);

			const res = await recordsCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(404);
		});

		it('should return 409 if attendance record update conflicts with existing record', async () => {
			const mockEvent = {
				params: { cuid: 'r1' },
				request: {
					json: vi.fn().mockResolvedValue({ status: 'Present' })
				},
				locals: mockLocals
			};

			vi.mocked(attendanceRecordService.getAttendanceRecordByCuid).mockResolvedValue({ cuid: 'r1' } as any);
			vi.mocked(attendanceRecordService.updateAttendanceRecord).mockRejectedValue(
				new attendanceRecordService.AttendanceValidationError('date', 'An attendance record already exists for this employee on this date')
			);

			const res = await recordsCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(409);
		});
	});

});
