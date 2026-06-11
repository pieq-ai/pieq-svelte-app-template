import type { ParsedPayrollRow } from '$lib/server/utils/excel-parser.js';

export interface PayrollRowValidationError {
	row: number;
	employee_code: string;
	reason: string;
}

export interface RowValidationResult {
	errors: PayrollRowValidationError[];
	validatedData?: {
		employee_code: string;
		employee_name: string;
		month: number;
		year: number;
		components: Record<string, number>;
		gross_earnings?: number;
		total_deduction?: number;
		net_salary?: number;
	};
}

// ─── Row-level validation ─────────────────────────────────────────────────────

/**
 * Validate a single parsed payroll row.
 * Returns errors (if any) and the validated/sanitised data (if valid).
 */
export function validatePayrollRow(row: ParsedPayrollRow): RowValidationResult {
	const errors: PayrollRowValidationError[] = [];

	// Validate employee_code
	if (!row.employee_code || !row.employee_code.trim()) {
		errors.push({
			row: row.rowIndex,
			employee_code: row.employee_code || '(empty)',
			reason: 'Employee code (Emp No) is missing or empty.'
		});
	}

	// Validate month
	if (row.month === null || row.month === undefined) {
		errors.push({
			row: row.rowIndex,
			employee_code: row.employee_code || '(empty)',
			reason: 'Month is missing or cannot be parsed. Accepted formats: "June", "Jun", 6, "06".'
		});
	} else if (row.month < 1 || row.month > 12) {
		errors.push({
			row: row.rowIndex,
			employee_code: row.employee_code,
			reason: `Month value ${row.month} is out of range (must be 1-12).`
		});
	}

	// Validate year
	if (row.year === null || row.year === undefined) {
		errors.push({
			row: row.rowIndex,
			employee_code: row.employee_code || '(empty)',
			reason: 'Year is missing or cannot be parsed.'
		});
	} else if (row.year < 2000 || row.year > 9999) {
		errors.push({
			row: row.rowIndex,
			employee_code: row.employee_code,
			reason: `Year value ${row.year} is not a valid 4-digit year.`
		});
	}

	if (errors.length > 0) {
		return { errors };
	}

	return {
		errors: [],
		validatedData: {
			employee_code: row.employee_code.trim(),
			employee_name: row.employee_name.trim(),
			month: row.month!,
			year: row.year!,
			components: row.components,
			gross_earnings: row.gross_earnings,
			total_deduction: row.total_deduction,
			net_salary: row.net_salary
		}
	};
}

// ─── File-level validation ────────────────────────────────────────────────────

/** Validate that the uploaded file is an accepted Excel MIME type. */
export function validateExcelMimeType(type: string): boolean {
	const accepted = new Set([
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
		'application/vnd.ms-excel', // .xls
		'application/octet-stream' // fallback for some browsers
	]);
	return accepted.has(type);
}

/** Validate that the file extension is .xlsx or .xls */
export function validateExcelExtension(filename: string): boolean {
	return /\.(xlsx|xls)$/i.test(filename);
}
