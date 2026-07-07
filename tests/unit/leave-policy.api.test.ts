import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as leavePolicyService from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError, LeaveMultiValidationError } from '$lib/server/services/leave-type.service.js';
import * as policiesApi from '../../src/routes/api/leave/policies/+server.js';
import * as policiesCuidApi from '../../src/routes/api/leave/policies/[cuid]/+server.js';

vi.mock('$lib/server/services/leave-policy.service.js', () => ({
	listLeavePolicies: vi.fn(),
	getLeavePolicyByCuid: vi.fn(),
	createLeavePolicy: vi.fn(),
	updateLeavePolicy: vi.fn()
}));

describe('leave-policies API', () => {
	const mockLocals = {
		auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } })
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/leave/policies', () => {
		it('should list leave policies', async () => {
			const mockList = [
				{
					cuid: 'p1',
					leave_type_cuid: 't1',
					annual_limit: 15,
					employment_type_cuids: ['e1'],
					status: true
				}
			];
			vi.mocked(leavePolicyService.listLeavePolicies).mockResolvedValue(mockList as any);

			const res = await policiesApi.GET({} as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toEqual([
				{
					cuid: 'p1',
					leave_type_cuid: 't1',
					annual_limit: 15,
					employment_type_cuids: ['e1'],
					status: true,
					applicable_gender: null,
					document_required_after_days: null,
					max_carry_forward_days: null,
					max_annual_carry_forward_days: null,
					max_per_month: null
				}
			]);
		});
	});

	describe('POST /api/leave/policies', () => {
		it('should return 400 for invalid JSON', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
				},
				locals: mockLocals
			};
			const res = await policiesApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
		});

		it('should create leave policy on success', async () => {
			const payload = {
				leave_type_cuid: 't1',
				employment_type_cuids: ['e1'],
				annual_limit: 15
			};
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue(payload)
				},
				locals: mockLocals
			};

			vi.mocked(leavePolicyService.createLeavePolicy).mockResolvedValue({ cuid: 'policy-123' } as any);

			const res = await policiesApi.POST(mockEvent as any);
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body.data.cuid).toBe('policy-123');
		});

		it('should return 400 for validation errors', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue({ annual_limit: -5 })
				},
				locals: mockLocals
			};

			vi.mocked(leavePolicyService.createLeavePolicy).mockRejectedValue(
				new LeaveValidationError('annual_limit', 'Must be positive')
			);

			const res = await policiesApi.POST(mockEvent as any);
			expect(res.status).toBe(400);
		});

		it('should return 409 for duplicate policy conflict error', async () => {
			const mockEvent = {
				request: {
					json: vi.fn().mockResolvedValue({ leave_type_cuid: 't1' })
				},
				locals: mockLocals
			};

			vi.mocked(leavePolicyService.createLeavePolicy).mockRejectedValue(
				new LeaveMultiValidationError({
					employment_type_cuids: 'Leave Policy already exists for this employment type and leave type'
				})
			);

			const res = await policiesApi.POST(mockEvent as any);
			expect(res.status).toBe(409);
		});
	});

	describe('GET /api/leave/policies/[cuid]', () => {
		it('should return 404 if not found', async () => {
			vi.mocked(leavePolicyService.getLeavePolicyByCuid).mockResolvedValue(null);
			const res = await policiesCuidApi.GET({ params: { cuid: 'p1' } } as any);
			expect(res.status).toBe(404);
		});

		it('should return policy if found', async () => {
			const mockPolicy = { cuid: 'p1', annual_limit: 10 };
			vi.mocked(leavePolicyService.getLeavePolicyByCuid).mockResolvedValue(mockPolicy as any);

			const res = await policiesCuidApi.GET({ params: { cuid: 'p1' } } as any);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.data).toEqual({
				cuid: 'p1',
				annual_limit: 10,
				applicable_gender: null,
				document_required_after_days: null,
				employment_type_cuids: [],
				max_carry_forward_days: null,
				max_annual_carry_forward_days: null,
				max_per_month: null
			});
		});
	});

	describe('PUT /api/leave/policies/[cuid]', () => {
		it('should update successfully', async () => {
			const mockEvent = {
				params: { cuid: 'p1' },
				request: {
					json: vi.fn().mockResolvedValue({ annual_limit: 20 })
				},
				locals: mockLocals
			};

			vi.mocked(leavePolicyService.updateLeavePolicy).mockResolvedValue({ cuid: 'p1' } as any);

			const res = await policiesCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(200);
		});

		it('should return 404 if leave policy to update is not found', async () => {
			const mockEvent = {
				params: { cuid: 'p1' },
				request: {
					json: vi.fn().mockResolvedValue({ annual_limit: 20 })
				},
				locals: mockLocals
			};

			vi.mocked(leavePolicyService.updateLeavePolicy).mockRejectedValue(
				new Error('Leave policy not found')
			);

			const res = await policiesCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(404);
		});

		it('should return 409 if leave policy update conflicts with existing policy', async () => {
			const mockEvent = {
				params: { cuid: 'p1' },
				request: {
					json: vi.fn().mockResolvedValue({ annual_limit: 20 })
				},
				locals: mockLocals
			};

			vi.mocked(leavePolicyService.updateLeavePolicy).mockRejectedValue(
				new LeaveMultiValidationError({
					employment_type_cuids: 'Leave Policy already exists for this employment type and leave type'
				})
			);

			const res = await policiesCuidApi.PUT(mockEvent as any);
			expect(res.status).toBe(409);
		});
	});

});
