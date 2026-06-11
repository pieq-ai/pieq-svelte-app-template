import { describe, it, expect } from 'vitest';
import {
	validatePayrollRow,
	validateExcelExtension,
	validateExcelMimeType
} from '$lib/server/validators/payroll.validator.js';
import { parseMonth, parseYear } from '$lib/server/utils/excel-parser.js';
import type { ParsedPayrollRow } from '$lib/server/utils/excel-parser.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<ParsedPayrollRow> = {}): ParsedPayrollRow {
	return {
		rowIndex: 2,
		employee_code: 'EMP001',
		employee_name: 'John Doe',
		month: 6,
		year: 2026,
		components: { Basic: 30000, HRA: 12000 },
		gross_earnings: 42000,
		total_deduction: 0,
		net_salary: 42000,
		isEmpty: false,
		...overrides
	};
}

// ─── parseMonth ────────────────────────────────────────────────────────────────

describe('parseMonth', () => {
	it('should parse numeric month', () => {
		expect(parseMonth(6)).toBe(6);
		expect(parseMonth(1)).toBe(1);
		expect(parseMonth(12)).toBe(12);
	});

	it('should parse string numeric month', () => {
		expect(parseMonth('6')).toBe(6);
		expect(parseMonth('06')).toBe(6);
		expect(parseMonth('12')).toBe(12);
	});

	it('should parse full month name (case-insensitive)', () => {
		expect(parseMonth('June')).toBe(6);
		expect(parseMonth('june')).toBe(6);
		expect(parseMonth('JUNE')).toBe(6);
		expect(parseMonth('January')).toBe(1);
		expect(parseMonth('December')).toBe(12);
	});

	it('should parse abbreviated month name', () => {
		expect(parseMonth('Jun')).toBe(6);
		expect(parseMonth('JUN')).toBe(6);
		expect(parseMonth('Jan')).toBe(1);
		expect(parseMonth('Dec')).toBe(12);
	});

	it('should return null for invalid month values', () => {
		expect(parseMonth(0)).toBeNull();
		expect(parseMonth(13)).toBeNull();
		expect(parseMonth('Junuary')).toBeNull();
		expect(parseMonth('')).toBeNull();
		expect(parseMonth(null)).toBeNull();
		expect(parseMonth(undefined)).toBeNull();
	});
});

// ─── parseYear ─────────────────────────────────────────────────────────────────

describe('parseYear', () => {
	it('should parse a valid 4-digit year', () => {
		expect(parseYear(2026)).toBe(2026);
		expect(parseYear(2000)).toBe(2000);
		expect(parseYear('2026')).toBe(2026);
	});

	it('should return null for invalid year values', () => {
		expect(parseYear(1999)).toBeNull();
		expect(parseYear('abc')).toBeNull();
		expect(parseYear(null)).toBeNull();
		expect(parseYear('')).toBeNull();
	});
});

// ─── validatePayrollRow ────────────────────────────────────────────────────────

describe('validatePayrollRow', () => {
	it('should return validatedData for a fully valid row', () => {
		const { errors, validatedData } = validatePayrollRow(makeRow());

		expect(errors).toHaveLength(0);
		expect(validatedData).toBeDefined();
		expect(validatedData!.employee_code).toBe('EMP001');
		expect(validatedData!.month).toBe(6);
		expect(validatedData!.year).toBe(2026);
	});

	it('should return an error when employee_code is empty', () => {
		const { errors } = validatePayrollRow(makeRow({ employee_code: '' }));

		expect(errors).toHaveLength(1);
		expect(errors[0].reason).toContain('Employee code');
	});

	it('should return an error when employee_code is whitespace only', () => {
		const { errors } = validatePayrollRow(makeRow({ employee_code: '   ' }));

		expect(errors).toHaveLength(1);
	});

	it('should return an error when month is null', () => {
		const { errors } = validatePayrollRow(makeRow({ month: null }));

		expect(errors).toHaveLength(1);
		expect(errors[0].reason).toContain('Month is missing');
	});

	it('should return an error when month is out of range', () => {
		const { errors: low } = validatePayrollRow(makeRow({ month: 0 }));
		const { errors: high } = validatePayrollRow(makeRow({ month: 13 }));

		expect(low[0].reason).toContain('out of range');
		expect(high[0].reason).toContain('out of range');
	});

	it('should return an error when year is null', () => {
		const { errors } = validatePayrollRow(makeRow({ year: null }));

		expect(errors).toHaveLength(1);
		expect(errors[0].reason).toContain('Year is missing');
	});

	it('should return errors for multiple invalid fields', () => {
		const { errors } = validatePayrollRow(makeRow({ employee_code: '', month: null, year: null }));

		expect(errors.length).toBeGreaterThanOrEqual(3);
	});

	it('should trim employee_code in validatedData', () => {
		const { validatedData } = validatePayrollRow(makeRow({ employee_code: '  EMP001  ' }));

		expect(validatedData!.employee_code).toBe('EMP001');
	});

	it('should include rowIndex in error objects', () => {
		const { errors } = validatePayrollRow(makeRow({ employee_code: '', rowIndex: 5 }));

		expect(errors[0].row).toBe(5);
	});
});

// ─── validateExcelExtension ────────────────────────────────────────────────────

describe('validateExcelExtension', () => {
	it('should accept .xlsx files', () => {
		expect(validateExcelExtension('payroll.xlsx')).toBe(true);
		expect(validateExcelExtension('Payroll June 2026.xlsx')).toBe(true);
	});

	it('should accept .xls files', () => {
		expect(validateExcelExtension('payroll.xls')).toBe(true);
	});

	it('should reject non-Excel files', () => {
		expect(validateExcelExtension('payroll.csv')).toBe(false);
		expect(validateExcelExtension('payroll.pdf')).toBe(false);
		expect(validateExcelExtension('payroll.txt')).toBe(false);
	});

	it('should be case-insensitive', () => {
		expect(validateExcelExtension('PAYROLL.XLSX')).toBe(true);
		expect(validateExcelExtension('PAYROLL.XLS')).toBe(true);
	});
});

// ─── validateExcelMimeType ─────────────────────────────────────────────────────

describe('validateExcelMimeType', () => {
	it('should accept valid Excel MIME types', () => {
		expect(
			validateExcelMimeType(
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			)
		).toBe(true);
		expect(validateExcelMimeType('application/vnd.ms-excel')).toBe(true);
		expect(validateExcelMimeType('application/octet-stream')).toBe(true);
	});

	it('should reject invalid MIME types', () => {
		expect(validateExcelMimeType('text/csv')).toBe(false);
		expect(validateExcelMimeType('application/pdf')).toBe(false);
	});
});
