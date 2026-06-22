/**
 * Employee Provider — thin adapter between the Salary Structure / Payroll modules
 * and the canonical Employee DAO.
 *
 * This file is the ONLY dependency point for employee data within the Salary
 * Structure and Payroll modules.  All functions delegate to `employee.dao.ts`;
 * no logic lives here.
 */

import * as employeeDao from '$lib/server/dao/employee.dao.js';

/** Minimal employee shape consumed by Salary Structure and Payroll UIs. */
export interface EmployeeOption {
	/** Prisma-generated CUID — stored in salary_structures.employee_cuid */
	cuid: string;
	/** Human-readable employee code (e.g. "PQ001") */
	employee_id: string;
	/** Full display name */
	name: string;
}

/** @deprecated Use EmployeeOption. Kept for backward-compatibility with existing consumers. */
export type MockEmployee = EmployeeOption;

// ─── Internal helper ──────────────────────────────────────────────────────────

function toOption(emp: { cuid: string; emp_code: string; first_name: string; last_name: string }): EmployeeOption {
	return {
		cuid: emp.cuid,
		employee_id: emp.emp_code,
		name: `${emp.first_name} ${emp.last_name}`
	};
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return all active employees as lightweight options for dropdowns. */
export async function getAll(): Promise<EmployeeOption[]> {
	const employees = await employeeDao.list();
	return employees.map(toOption);
}

/** Find an employee by their CUID. Returns null if not found or deleted. */
export async function findEmployeeByCuid(cuid: string): Promise<EmployeeOption | null> {
	const emp = await employeeDao.findByCuid2(cuid);
	return emp ? toOption(emp) : null;
}

/**
 * Find an employee by their employee code (emp_code).
 * Used by the Payroll module to match Excel rows via "Emp No".
 * Case-insensitive match.
 * Returns null if not found or deleted.
 */
export async function findEmployeeByCode(employeeCode: string): Promise<EmployeeOption | null> {
	const code = employeeCode.trim().toUpperCase();
	const emp = await employeeDao.findByEmpCode(code);
	return emp ? toOption(emp) : null;
}
