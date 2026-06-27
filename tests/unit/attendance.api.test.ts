import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as attendanceService from '$lib/server/services/attendance.service.js';
import * as checkInApi from '../../src/routes/api/attendance/check-in/+server.js';
import * as checkOutApi from '../../src/routes/api/attendance/check-out/+server.js';

vi.mock('$lib/server/services/attendance.service.js', () => ({
	checkIn: vi.fn(),
	checkOut: vi.fn(),
	AttendanceValidationError: class extends Error {
		field: string;
		constructor(field: string, msg: string) {
			super(msg);
			this.name = 'AttendanceValidationError';
			this.field = field;
		}
	}
}));

describe('attendance API', () => {
	const mockLocals = {
		auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } })
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('POST /api/attendance/check-in', () => {
		it('should check in successfully', async () => {
			const payload = { employee_cuid: 'emp-1', attendance_source_cuid: 'source-1', latitude: 12.34, longitude: 56.78 };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(attendanceService.checkIn).mockResolvedValue({ cuid: 'rec-123' } as any);

			const res = await checkInApi.POST(mockEvent as any);
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.data.message).toBe('Checked in successfully');
			expect(body.data.cuid).toBe('rec-123');
		});

		it('should return 400 for validation errors', async () => {
			const payload = { employee_cuid: '' };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(attendanceService.checkIn).mockRejectedValue(
				new attendanceService.AttendanceValidationError('employee_cuid', 'Employee is required')
			);

			const res = await checkInApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.data.error.employee_cuid).toBe('Employee is required');
		});

		it('should return 409 for check-in conflict when already checked in', async () => {
			const payload = { employee_cuid: 'emp-1' };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(attendanceService.checkIn).mockRejectedValue(
				new attendanceService.AttendanceValidationError('employee_cuid', 'Already checked in for today')
			);

			const res = await checkInApi.POST(mockEvent as any);
			expect(res.status).toBe(409);
		});
	});

	describe('PUT /api/attendance/check-out', () => {
		it('should check out successfully', async () => {
			const payload = { employee_cuid: 'emp-1', latitude: 12.34, longitude: 56.78 };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(attendanceService.checkOut).mockResolvedValue({ cuid: 'rec-123' } as any);

			const res = await checkOutApi.PUT(mockEvent as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data.message).toBe('Checked out successfully');
			expect(body.data.cuid).toBe('rec-123');
		});

		it('should return 400 for validation errors', async () => {
			const payload = { employee_cuid: 'emp-1' };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(attendanceService.checkOut).mockRejectedValue(
				new attendanceService.AttendanceValidationError('employee_cuid', 'You are outside the office zone')
			);

			const res = await checkOutApi.PUT(mockEvent as any);
			expect(res.status).toBe(400);
		});

		it('should return 409 for check-out conflict when no open check-in record exists', async () => {
			const payload = { employee_cuid: 'emp-1' };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(attendanceService.checkOut).mockRejectedValue(
				new attendanceService.AttendanceValidationError('employee_cuid', 'No open check-in record found')
			);

			const res = await checkOutApi.PUT(mockEvent as any);
			expect(res.status).toBe(409);
		});
	});
});
