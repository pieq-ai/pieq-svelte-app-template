import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load as loadCreate } from '../../src/routes/employees/create/+page.server.ts';
import { load as loadEdit } from '../../src/routes/employees/[cuid]/+page.server.ts';
import * as departmentService from '$lib/server/services/department.service';
import * as designationService from '$lib/server/services/designation.service';
import * as masterDataService from '$lib/server/services/master-data.service';
import * as employeeService from '$lib/server/services/employee.service';
import * as employmentService from '$lib/server/services/employment.service';
import * as roleService from '$lib/server/services/role.service';
import * as locationService from '$lib/server/services/organization_location.service';

vi.mock('$lib/server/services/department.service', () => ({
	getDepartments: vi.fn()
}));

vi.mock('$lib/server/services/designation.service', () => ({
	getDesignations: vi.fn()
}));

vi.mock('$lib/server/services/master-data.service', () => ({
	getMasterData: vi.fn()
}));

vi.mock('$lib/server/services/employee.service', () => ({
	getEmployeeByCuid2: vi.fn(),
	getEmployees: vi.fn()
}));

vi.mock('$lib/server/services/employment.service', () => ({
	getEmploymentByEmployeeCuid: vi.fn()
}));

vi.mock('$lib/server/services/role.service', () => ({
	listRoles: vi.fn()
}));

vi.mock('$lib/server/services/organization_location.service', () => ({
	listLocations: vi.fn()
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

		vi.mocked(roleService.listRoles).mockResolvedValue(
			{ data: [{ id: 1n, cuid: 'role_1', name: 'HR Manager', status: true }] } as unknown as Awaited<ReturnType<typeof roleService.listRoles>>
		);
		vi.mocked(locationService.listLocations).mockResolvedValue(
			{ data: [{ id: 2n, cuid: 'loc_1', name: 'Office 1', status: true }] } as unknown as Awaited<ReturnType<typeof locationService.listLocations>>
		);
		vi.mocked(employeeService.getEmployees).mockResolvedValue(
			[{ cuid: 'emp_1', first_name: 'John', last_name: 'Doe' }] as unknown as Awaited<ReturnType<typeof employeeService.getEmployees>>
		);

		const result = await loadCreate({} as unknown as Parameters<typeof loadCreate>[0]) as unknown as CreateLoadResult;

		expect(result).toHaveProperty('roles');
		expect(result.roles).toEqual([{ id: 1n, cuid: 'role_1', name: 'HR Manager', status: true }]);
		expect(result.locations).toEqual([{
			cuid: 'loc_1',
			name: 'Office 1',
			address_line1: undefined,
			address_line2: undefined,
			city: undefined,
			state_cuid: undefined,
			country_cuid: undefined,
			pin_code: undefined,
			timezone: undefined,
			latitude: null,
			longitude: null,
			status: true,
			created_by: null,
			updated_by: null
		}]);
		expect(result.employees).toEqual([{ cuid: 'emp_1', first_name: 'John', last_name: 'Doe' }]);
	});
});

describe('Employee Edit Page Load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should throw 404 error if employee not found', async () => {
		vi.mocked(employeeService.getEmployeeByCuid2).mockRejectedValue(new Error('Employee not found'));

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
		vi.mocked(employeeService.getEmployeeByCuid2).mockResolvedValue(
			{ id: 1n, cuid: 'emp_123', first_name: 'John', last_name: 'Doe' } as unknown as Awaited<ReturnType<typeof employeeService.getEmployeeByCuid2>>
		);
		vi.mocked(employmentService.getEmploymentByEmployeeCuid).mockResolvedValue(
			{ id: 2n, employee_cuid: 'emp_123', department_cuid: 'dept_1' } as unknown as Awaited<ReturnType<typeof employmentService.getEmploymentByEmployeeCuid>>
		);
		vi.mocked(roleService.listRoles).mockResolvedValue(
			{ data: [{ id: 3n, cuid: 'role_1', name: 'Role 1', status: true }] } as unknown as Awaited<ReturnType<typeof roleService.listRoles>>
		);
		vi.mocked(locationService.listLocations).mockResolvedValue(
			{ data: [{ id: 4n, cuid: 'loc_1', name: 'Location 1', status: true }] } as unknown as Awaited<ReturnType<typeof locationService.listLocations>>
		);
		vi.mocked(employeeService.getEmployees).mockResolvedValue(
			[{ cuid: 'emp_999', first_name: 'Manager', last_name: 'Bob' }] as unknown as Awaited<ReturnType<typeof employeeService.getEmployees>>
		);

		const result = await loadEdit({ params: { cuid: 'emp_123' } } as unknown as Parameters<typeof loadEdit>[0]) as unknown as EditLoadResult;

		expect(result.employee.first_name).toBe('John');
		expect(result.employment.department_cuid).toBe('dept_1');
		expect(result.roles).toEqual([{ id: 3n, cuid: 'role_1', name: 'Role 1', status: true }]);
		expect(result.locations).toEqual([{
			cuid: 'loc_1',
			name: 'Location 1',
			address_line1: undefined,
			address_line2: undefined,
			city: undefined,
			state_cuid: undefined,
			country_cuid: undefined,
			pin_code: undefined,
			timezone: undefined,
			latitude: null,
			longitude: null,
			status: true,
			created_by: null,
			updated_by: null
		}]);
		expect(result.employees).toEqual([{ cuid: 'emp_999', first_name: 'Manager', last_name: 'Bob' }]);
	});
});
