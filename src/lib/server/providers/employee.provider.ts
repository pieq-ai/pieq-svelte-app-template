/**
 * Mock Employee Provider — temporary until a real Employee API is available.
 *
 * IMPORTANT: This file is the ONLY dependency point for employee data within
 * the Salary Structure module. When the Employee API is ready, replace the
 * contents of this file only — no other salary-structure file needs changes.
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
	{ cuid: 'EMP004', employee_id: 'EMP004', name: 'Sara Smith' }
];

/** Find a mock employee by their cuid. Returns null if not found. */
export function findEmployeeByCuid(cuid: string): MockEmployee | null {
	return MOCK_EMPLOYEES.find((e) => e.cuid === cuid) ?? null;
}
