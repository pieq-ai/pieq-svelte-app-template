/**
 * Mock Employee Provider — temporary until a real Employee API is available.
 *
 * IMPORTANT: This file is the ONLY dependency point for employee data within
 * the Salary Structure and Payroll modules. When the Employee API is ready,
 * replace the contents of this file only — no other file needs changes.
 */

export interface MockEmployee {
	/** Used as the public CUID reference stored in salary_structures.employee_cuid */
	cuid: string;
	/** Human-readable employee ID (e.g. "EMP001") */
	employee_id: string;
	/** Full display name */
	name: string;
}

export const MOCK_EMPLOYEES: MockEmployee[] = [
	{ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' },
	{ cuid: 'EMP002', employee_id: 'EMP002', name: 'Alice Smith' },
	{ cuid: 'EMP003', employee_id: 'EMP003', name: 'Bob Wilson' },
	{ cuid: 'EMP004', employee_id: 'EMP004', name: 'Sara Smith' },
	{ cuid: 'PQ001', employee_id: 'PQ001', name: 'Arun Kumar' },
	{ cuid: 'PQ002', employee_id: 'PQ002', name: 'Priya Sharma' },
	{ cuid: 'PQ003', employee_id: 'PQ003', name: 'Rahul Verma' },
	{ cuid: 'PQ004', employee_id: 'PQ004', name: 'Sneha Reddy' },
	{ cuid: 'PQ005', employee_id: 'PQ005', name: 'Kiran Patel' },
	{ cuid: 'PQ006', employee_id: 'PQ006', name: 'Ananya Rao' },
	{ cuid: 'PQ007', employee_id: 'PQ007', name: 'Vikram Singh' },
	{ cuid: 'PQ008', employee_id: 'PQ008', name: 'Neha Gupta' },
	{ cuid: 'PQ009', employee_id: 'PQ009', name: 'Rohit Das' },
	{ cuid: 'PQ010', employee_id: 'PQ010', name: 'Pooja Nair' },
	{ cuid: 'PQ011', employee_id: 'PQ011', name: 'Amit Joshi' },
	{ cuid: 'PQ012', employee_id: 'PQ012', name: 'Sanjay Kumar' },
	{ cuid: 'PQ013', employee_id: 'PQ013', name: 'Nisha Sharma' },
	{ cuid: 'PQ014', employee_id: 'PQ014', name: 'Rajesh Patil' },
	{ cuid: 'PQ015', employee_id: 'PQ015', name: 'Sunita Rao' },
	{ cuid: 'PQ016', employee_id: 'PQ016', name: 'Ajay Verma' },
	{ cuid: 'PQ017', employee_id: 'PQ017', name: 'Kavita Singh' },
	{ cuid: 'PQ018', employee_id: 'PQ018', name: 'Rohan Mehta' },
	{ cuid: 'PQ019', employee_id: 'PQ019', name: 'Deepa Shah' },
	{ cuid: 'PQ020', employee_id: 'PQ020', name: 'Vijay Sharma' }
];

/** Find a mock employee by their cuid. Returns null if not found. */
export function findEmployeeByCuid(cuid: string): MockEmployee | null {
	return MOCK_EMPLOYEES.find((e) => e.cuid === cuid) ?? null;
}

/**
 * Find a mock employee by their employee code (employee_id).
 * Used by the Payroll module to match Excel rows via "Emp No".
 * Case-insensitive match.
 * Returns null if not found.
 */
export function findEmployeeByCode(employeeCode: string): MockEmployee | null {
	const code = employeeCode.trim().toUpperCase();
	return MOCK_EMPLOYEES.find((e) => e.employee_id.toUpperCase() === code) ?? null;
}

