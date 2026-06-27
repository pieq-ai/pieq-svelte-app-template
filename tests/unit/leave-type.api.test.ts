import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as leaveTypeService from '$lib/server/services/leave-type.service.js';
import * as typesApi from '../../src/routes/api/leave/types/+server.js';
import * as typesCuidApi from '../../src/routes/api/leave/types/[cuid]/+server.js';

vi.mock('$lib/server/services/leave-type.service.js', () => ({
	listLeaveTypes: vi.fn(),
	getLeaveTypeByCuid: vi.fn(),
	createLeaveType: vi.fn(),
	updateLeaveType: vi.fn(),
	LeaveValidationError: class extends Error {
		field: string;
		constructor(field: string, msg: string) {
			super(msg);
			this.name = 'LeaveValidationError';
			this.field = field;
		}
	},
	LeaveMultiValidationError: class extends Error {
		fields: any;
		constructor(fields: any) {
			super('Validation failed');
			this.name = 'LeaveMultiValidationError';
			this.fields = fields;
		}
	}
}));

describe('leave-types API', () => {
	const mockLocals = {
		auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } })
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/leave/types', () => {
		it('should list leave types successfully', async () => {
			const mockList = [
				{
					cuid: 'c1',
					name: 'Annual Leave',
					code: 'ANNUAL',
					description: 'Paid',
					is_paid: true,
					requires_approval: true,
					status: true
				}
			];
			vi.mocked(leaveTypeService.listLeaveTypes).mockResolvedValue(mockList as any);

			const res = await typesApi.GET({} as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toEqual([
				{
					cuid: 'c1',
					name: 'Annual Leave',
					code: 'ANNUAL',
					description: 'Paid',
					is_paid: true,
					requires_approval: true,
					status: true
				}
			]);
		});

		it('should handle internal errors gracefully', async () => {
			vi.mocked(leaveTypeService.listLeaveTypes).mockRejectedValue(new Error('Internal server error'));

			const res = await typesApi.GET({} as any);
			expect(res.status).toBe(500);
		});
	});

	describe('POST /api/leave/types', () => {
		it('should return 400 for invalid JSON body', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
				},
				locals: mockLocals
			};

			const res = await typesApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.error.general).toBe('Request body must be valid JSON');
		});

		it('should return 400 for disallowed keys', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Annual Leave', code: 'ANNUAL', invalid_key: 'bad' })
				},
				locals: mockLocals
			};

			const res = await typesApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.error.general).toContain('Invalid, unexpected or misspelled key');
		});

		it('should return 201 on success', async () => {
			const payload = { name: 'Sick Leave', code: 'SICK' };
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(leaveTypeService.createLeaveType).mockResolvedValue({ cuid: 'cuid-123' } as any);

			const res = await typesApi.POST(mockEvent as any);
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.data.cuid).toBe('cuid-123');
			expect(leaveTypeService.createLeaveType).toHaveBeenCalledWith({
				name: 'Sick Leave',
				code: 'SICK',
				description: undefined,
				is_paid: undefined,
				requires_approval: undefined,
				status: undefined,
				created_by: 'user-1',
				updated_by: 'user-1'
			});
		});

		it('should return 400 on service single validation error', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue({ name: '', code: 'SICK' })
				},
				locals: mockLocals
			};

			vi.mocked(leaveTypeService.createLeaveType).mockRejectedValue(
				new leaveTypeService.LeaveValidationError('name', 'Leave name is required')
			);

			const res = await typesApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.data.error.name).toBe('Leave name is required');
		});

		it('should return 400 on service multi validation error', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Sick', code: 'SICK_123' })
				},
				locals: mockLocals
			};

			vi.mocked(leaveTypeService.createLeaveType).mockRejectedValue(
				new leaveTypeService.LeaveMultiValidationError({
					name: 'Leave name must be longer',
					code: 'Invalid code format'
				})
			);

			const res = await typesApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.data.error).toEqual({
				name: 'Leave name must be longer',
				code: 'Invalid code format'
			});
		});
	});

	describe('GET /api/leave/types/[cuid]', () => {
		it('should return 404 if not found', async () => {
			vi.mocked(leaveTypeService.getLeaveTypeByCuid).mockResolvedValue(null);

			const res = await typesCuidApi.GET({ params: { cuid: 'c1' } } as any);
			expect(res.status).toBe(404);
		});

		it('should return leave type if found', async () => {
			const mockResult = {
				cuid: 'c1',
				name: 'Sick Leave',
				code: 'SICK',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true
			};
			vi.mocked(leaveTypeService.getLeaveTypeByCuid).mockResolvedValue(mockResult as any);

			const res = await typesCuidApi.GET({ params: { cuid: 'c1' } } as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toEqual({
				cuid: 'c1',
				name: 'Sick Leave',
				code: 'SICK',
				description: null,
				is_paid: true,
				requires_approval: true,
				status: true
			});
		});
	});

	describe('PUT /api/leave/types/[cuid]', () => {
		it('should update leave type successfully', async () => {
			const mockEvent = {
				params: { cuid: 'c1' },
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Sick Leave Updated' })
				},
				locals: mockLocals
			};

			vi.mocked(leaveTypeService.updateLeaveType).mockResolvedValue({ cuid: 'c1' } as any);

			const res = await typesCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data.cuid).toBe('c1');
		});
	});

});
