import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load as loadCreate } from '../../src/routes/employees/create/+page.server.ts';
import { load as loadEdit } from '../../src/routes/employees/[cuid]/+page.server.ts';
import { db } from '$lib/server/db.js';
import * as departmentService from '$lib/server/services/department.service.js';
import * as designationService from '$lib/server/services/designation.service.js';
import * as masterDataService from '$lib/server/services/master-data.service.js';

vi.mock('$lib/server/db.js', () => ({
	db: {
		role: {
			findMany: vi.fn()
		},
		companyLocation: {
			findMany: vi.fn()
		},
		employee: {
			findMany: vi.fn(),
			findUnique: vi.fn()
		},
		employment: {
			findFirst: vi.fn()
		}
	}
}));

vi.mock('$lib/server/services/department.service.js', () => ({
	getDepartments: vi.fn()
}));

vi.mock('$lib/server/services/designation.service.js', () => ({
	getDesignations: vi.fn()
}));

vi.mock('$lib/server/services/master-data.service.js', () => ({
	getMasterData: vi.fn()
}));

interface CreateLoadResult {
	departments: unknown[];
	designations: unknown[];
	roles: { cuid: string; name: string }[];
	bloodGroups: unknown[];
	nationalities: unknown[];
	employmentTypes: unknown[];
	payGrades: unknown[];
	relationTypes: unknown[];
	documentTypes: unknown[];
	skills: unknown[];
	languages: unknown[];
	countries: unknown[];
	states: unknown[];
	locations: { cuid: string; name: string }[];
	employees: { cuid: string; first_name: string; last_name: string }[];
}

interface EditLoadResult {
	employee: { cuid: string; first_name: string; last_name: string };
	employment: { employee_cuid: string; department_cuid: string };
	roles: { cuid: string; name: string }[];
	locations: { cuid: string; name: string }[];
	employees: { cuid: string; first_name: string; last_name: string }[];
}

describe('Employee Create Page Load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should successfully load all master dependencies and serialize roles and locations correctly', async () => {
		// Mock services
		vi.mocked(departmentService.getDepartments).mockResolvedValue(
			[{ cuid: 'dept_1', name: 'HR', status: true }] as unknown as Awaited<ReturnType<typeof departmentService.getDepartments>>
		);
		vi.mocked(designationService.getDesignations).mockResolvedValue(
			[{ cuid: 'desg_1', name: 'Manager', status: true }] as unknown as Awaited<ReturnType<typeof designationService.getDesignations>>
		);
		vi.mocked(masterDataService.getMasterData).mockResolvedValue([]);

		// Mock prisma client
		vi.mocked(db.role.findMany).mockResolvedValue(
			[{ id: 1n, cuid: 'role_1', name: 'HR Manager', status: true }] as unknown as Awaited<ReturnType<typeof db.role.findMany>>
		);
		vi.mocked(db.companyLocation.findMany).mockResolvedValue(
			[{ id: 2n, cuid: 'loc_1', name: 'Office 1', status: true }] as unknown as Awaited<ReturnType<typeof db.companyLocation.findMany>>
		);
		vi.mocked(db.employee.findMany).mockResolvedValue(
			[{ cuid: 'emp_1', first_name: 'John', last_name: 'Doe' }] as unknown as Awaited<ReturnType<typeof db.employee.findMany>>
		);

		const result = await loadCreate({} as unknown as Parameters<typeof loadCreate>[0]) as unknown as CreateLoadResult;

		expect(result).toHaveProperty('roles');
		expect(result.roles).toEqual([{ cuid: 'role_1', name: 'HR Manager' }]);
		expect(result.locations).toEqual([{ cuid: 'loc_1', name: 'Office 1' }]);
		expect(result.employees).toEqual([{ cuid: 'emp_1', first_name: 'John', last_name: 'Doe' }]);
	});
});

describe('Employee Edit Page Load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should throw 404 error if employee not found', async () => {
		vi.mocked(db.employee.findUnique).mockResolvedValue(null);

		try {
			await loadEdit({ params: { cuid: 'invalid' } } as unknown as Parameters<typeof loadEdit>[0]);
			expect.fail('Should have thrown an error');
		} catch (e: unknown) {
			const httpError = e as { status: number; body: { message: string } };
			expect(httpError.status).toBe(404);
			expect(httpError.body.message).toBe('Employee not found');
		}
	});

	it('should load employee, employment, and dropdown dependencies', async () => {
		vi.mocked(db.employee.findUnique).mockResolvedValue(
			{ id: 1n, cuid: 'emp_123', first_name: 'John', last_name: 'Doe' } as unknown as Awaited<ReturnType<typeof db.employee.findUnique>>
		);
		vi.mocked(db.employment.findFirst).mockResolvedValue(
			{ id: 2n, employee_cuid: 'emp_123', department_cuid: 'dept_1' } as unknown as Awaited<ReturnType<typeof db.employment.findFirst>>
		);
		vi.mocked(db.role.findMany).mockResolvedValue(
			[{ id: 3n, cuid: 'role_1', name: 'Role 1', status: true }] as unknown as Awaited<ReturnType<typeof db.role.findMany>>
		);
		vi.mocked(db.companyLocation.findMany).mockResolvedValue(
			[{ id: 4n, cuid: 'loc_1', name: 'Location 1', status: true }] as unknown as Awaited<ReturnType<typeof db.companyLocation.findMany>>
		);
		vi.mocked(db.employee.findMany).mockResolvedValue(
			[{ cuid: 'emp_999', first_name: 'Manager', last_name: 'Bob' }] as unknown as Awaited<ReturnType<typeof db.employee.findMany>>
		);

		const result = await loadEdit({ params: { cuid: 'emp_123' } } as unknown as Parameters<typeof loadEdit>[0]) as unknown as EditLoadResult;

		expect(result.employee.first_name).toBe('John');
		expect(result.employment.department_cuid).toBe('dept_1');
		expect(result.roles).toEqual([{ cuid: 'role_1', name: 'Role 1' }]);
		expect(result.locations).toEqual([{ cuid: 'loc_1', name: 'Location 1' }]);
		expect(result.employees).toEqual([{ cuid: 'emp_999', first_name: 'Manager', last_name: 'Bob' }]);
	});
});
