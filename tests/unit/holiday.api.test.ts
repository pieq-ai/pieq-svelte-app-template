import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as holidayService from '$lib/server/services/holiday.service.js';
import * as holidaysApi from '../../src/routes/api/holidays/+server.js';
import * as holidaysCuidApi from '../../src/routes/api/holidays/[cuid]/+server.js';

vi.mock('$lib/server/services/holiday.service.js', () => ({
	listHolidays: vi.fn(),
	getHolidayByCuid: vi.fn(),
	createHoliday: vi.fn(),
	updateHoliday: vi.fn(),
	deleteHoliday: vi.fn(),
	HolidayValidationError: class extends Error {
		field: string;
		constructor(field: string, msg: string) {
			super(msg);
			this.name = 'HolidayValidationError';
			this.field = field;
		}
	},
	HolidayMultiValidationError: class extends Error {
		fields: any;
		constructor(fields: any) {
			super('Validation failed');
			this.name = 'HolidayMultiValidationError';
			this.fields = fields;
		}
	}
}));

describe('holidays API', () => {
	const mockLocals = {
		auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } })
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/holidays', () => {
		it('should list holidays successfully', async () => {
			const mockList = [
				{
					cuid: 'h1',
					name: 'Christmas',
					date: new Date(),
					type: 'National'
				}
			];
			vi.mocked(holidayService.listHolidays).mockResolvedValue(mockList as any);

			const res = await holidaysApi.GET({} as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toBeDefined();
		});
	});

	describe('POST /api/holidays', () => {
		it('should create holiday successfully', async () => {
			const payload = { name: 'Independence Day', date: '2026-07-04', type: 'National' };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(holidayService.createHoliday).mockResolvedValue({ cuid: 'h123' } as any);

			const res = await holidaysApi.POST(mockEvent as any);
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.data.cuid).toBe('h123');
		});

		it('should return 400 for validation errors', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue({ name: '' })
				},
				locals: mockLocals
			};

			vi.mocked(holidayService.createHoliday).mockRejectedValue(
				new holidayService.HolidayValidationError('name', 'Required')
			);

			const res = await holidaysApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
		});
	});

	describe('GET /api/holidays/[cuid]', () => {
		it('should return 404 if not found', async () => {
			vi.mocked(holidayService.getHolidayByCuid).mockResolvedValue(null);
			const res = await holidaysCuidApi.GET({ params: { cuid: 'h1' } } as any);
			expect(res.status).toBe(404);
		});

		it('should return holiday if found', async () => {
			const mockHoliday = { cuid: 'h1', name: 'Christmas', date: '2026-12-25', type: 'National' };
			vi.mocked(holidayService.getHolidayByCuid).mockResolvedValue(mockHoliday as any);

			const res = await holidaysCuidApi.GET({ params: { cuid: 'h1' } } as any);
			expect(res.status).toBe(200);
		});
	});

	describe('PUT /api/holidays/[cuid]', () => {
		it('should update successfully', async () => {
			const mockEvent = {
				params: { cuid: 'h1' },
				request: {
					json: vi.fn().mockResolvedValue({ name: 'New Year' })
				},
				locals: mockLocals
			};

			vi.mocked(holidayService.updateHoliday).mockResolvedValue({ cuid: 'h1' } as any);

			const res = await holidaysCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(200);
		});
	});

	describe('DELETE /api/holidays/[cuid]', () => {
		it('should delete successfully', async () => {
			const mockEvent = {
				params: { cuid: 'h1' },
				locals: mockLocals
			};

			vi.mocked(holidayService.deleteHoliday).mockResolvedValue({ cuid: 'h1' } as any);

			const res = await holidaysCuidApi.DELETE(mockEvent as any);
			expect(res.status).toBe(200);
		});
	});
});
