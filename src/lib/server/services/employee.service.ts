import * as employeeDao from '$lib/server/dao/employee.dao';

export const EMPLOYEE_NAME_MAX_LENGTH = 100;
export const EMPLOYEE_AGE_MIN = 1;
export const EMPLOYEE_AGE_MAX = 120;

/**
 * Thrown when caller input fails service-layer validation.
 * Controllers translate this to HTTP 400.
 */
export class EmployeeValidationError extends Error {
	readonly field: 'name' | 'age';

	constructor(field: 'name' | 'age', message: string) {
		super(message);
		this.name = 'EmployeeValidationError';
		this.field = field;
	}
}

export interface CreateEmployeeInput {
	name: unknown;
	age: unknown;
}

function validateName(raw: unknown): string {
	if (typeof raw !== 'string') {
		throw new EmployeeValidationError('name', 'Name is required and must be a string');
	}

	const trimmed = raw.trim();

	if (trimmed.length === 0) {
		throw new EmployeeValidationError('name', 'Name cannot be empty');
	}

	if (trimmed.length > EMPLOYEE_NAME_MAX_LENGTH) {
		throw new EmployeeValidationError(
			'name',
			`Name must be ${EMPLOYEE_NAME_MAX_LENGTH} characters or fewer`
		);
	}

	return trimmed;
}

function validateAge(raw: unknown): number {
	const coerced = typeof raw === 'string' ? Number(raw) : raw;

	if (typeof coerced !== 'number' || !Number.isFinite(coerced)) {
		throw new EmployeeValidationError('age', 'Age is required and must be a valid number');
	}

	if (!Number.isInteger(coerced)) {
		throw new EmployeeValidationError('age', 'Age must be a whole number');
	}

	if (coerced < EMPLOYEE_AGE_MIN || coerced > EMPLOYEE_AGE_MAX) {
		throw new EmployeeValidationError(
			'age',
			`Age must be between ${EMPLOYEE_AGE_MIN} and ${EMPLOYEE_AGE_MAX}`
		);
	}

	return coerced;
}

export async function listEmployees() {
	return employeeDao.list();
}

export async function createEmployee(input: CreateEmployeeInput) {
	const name = validateName(input.name);
	const age = validateAge(input.age);

	return employeeDao.create({ name, age });
}