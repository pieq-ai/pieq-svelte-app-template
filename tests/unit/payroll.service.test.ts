import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	uploadPayroll,
	getPayrolls,
	getPayrollByCuid,
	PayrollNotFoundError
} from '$lib/server/services/payroll.service.js';

// ─── Mock DAO ─────────────────────────────────────────────────────────────────

vi.mock('$lib/server/dao/payroll.dao.js', () => ({
	create: vi.fn(),
	findByCuid: vi.fn(),
	findByEmployeeMonthYear: vi.fn(),
	findMany: vi.fn()
}));

// ─── Mock employee provider ───────────────────────────────────────────────────

vi.mock('$lib/server/providers/employee.provider.js', () => ({
	findEmployeeByCode: vi.fn()
}));

// ─── Import mocked modules ────────────────────────────────────────────────────

import * as dao from '$lib/server/dao/payroll.dao.js';
import { findEmployeeByCode } from '$lib/server/providers/employee.provider.js';
import type { ParsedPayrollRow } from '$lib/server/utils/excel-parser.js';

// ─── Builders ─────────────────────────────────────────────────────────────────

function mockEmployee(overrides = {}) {
	return { cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe', ...overrides };
}

function mockPayrollRecord(overrides = {}) {
	return {
		id: 1n,
		cuid: 'pay_001',
		employee_cuid: 'EMP001',
		employee_code: 'EMP001',
		employee_name: 'John Doe',
		month: 6,
		year: 2026,
		gross_earnings: 50000,
		total_deduction: 5000,
		net_salary: 45000,
		payroll_breakdown: { Basic: 30000, HRA: 12000, PF: 3600 },
		uploaded_at: new Date(),
		created_at: new Date(),
		created_by: null,
		updated_at: new Date(),
		updated_by: null,
		...overrides
	};
}

function mockParsedRow(overrides: Partial<ParsedPayrollRow> = {}): ParsedPayrollRow {
	return {
		rowIndex: 2,
		employee_code: 'EMP001',
		employee_name: 'John Doe',
		month: 6,
		year: 2026,
		components: { Basic: 30000, HRA: 12000, PF: 3600 },
		gross_earnings: 42000,
		total_deduction: 3600,
		net_salary: 38400,
		isEmpty: false,
		...overrides
	};
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Payroll Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ─── uploadPayroll ────────────────────────────────────────────────────────

	describe('uploadPayroll', () => {
		it('should create a record for a valid row with matching employee', async () => {
			vi.mocked(findEmployeeByCode).mockReturnValue(mockEmployee());
			vi.mocked(dao.findByEmployeeMonthYear).mockResolvedValue(null);
			vi.mocked(dao.create).mockResolvedValue(mockPayrollRecord() as never);

			const result = await uploadPayroll([mockParsedRow()]);

			expect(result.created).toBe(1);
			expect(result.skipped).toBe(0);
			expect(result.errors).toHaveLength(0);
			expect(dao.create).toHaveBeenCalledWith(
				expect.objectContaining({
					employee_cuid: 'EMP001',
					employee_code: 'EMP001',
					month: 6,
					year: 2026
				})
			);
		});

		it('should skip a row when employee code is not found', async () => {
			vi.mocked(findEmployeeByCode).mockReturnValue(null);

			const result = await uploadPayroll([mockParsedRow({ employee_code: 'UNKNOWN' })]);

			expect(result.created).toBe(0);
			expect(result.skipped).toBe(1);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].reason).toContain('not found');
			expect(dao.create).not.toHaveBeenCalled();
		});

		it('should skip a row when employee code is missing (validation error)', async () => {
			const result = await uploadPayroll([mockParsedRow({ employee_code: '' })]);

			expect(result.created).toBe(0);
			expect(result.skipped).toBe(1);
			expect(result.errors[0].reason).toContain('Employee code');
			expect(dao.create).not.toHaveBeenCalled();
		});

		it('should skip a row when month is null (validation error)', async () => {
			const result = await uploadPayroll([mockParsedRow({ month: null })]);

			expect(result.created).toBe(0);
			expect(result.skipped).toBe(1);
			expect(result.errors[0].reason).toContain('Month is missing');
		});

		it('should skip a row when year is null (validation error)', async () => {
			const result = await uploadPayroll([mockParsedRow({ year: null })]);

			expect(result.created).toBe(0);
			expect(result.skipped).toBe(1);
			expect(result.errors[0].reason).toContain('Year is missing');
		});

		it('should skip a row when duplicate record exists', async () => {
			vi.mocked(findEmployeeByCode).mockReturnValue(mockEmployee());
			vi.mocked(dao.findByEmployeeMonthYear).mockResolvedValue(mockPayrollRecord() as never);

			const result = await uploadPayroll([mockParsedRow()]);

			expect(result.created).toBe(0);
			expect(result.skipped).toBe(1);
			expect(result.errors[0].reason).toContain('already exists');
			expect(dao.create).not.toHaveBeenCalled();
		});

		it('should continue processing remaining rows after a skipped row', async () => {
			const rows = [
				mockParsedRow({ employee_code: 'UNKNOWN', rowIndex: 2 }),
				mockParsedRow({ employee_code: 'EMP001', rowIndex: 3 })
			];

			vi.mocked(findEmployeeByCode)
				.mockReturnValueOnce(null)
				.mockReturnValueOnce(mockEmployee());
			vi.mocked(dao.findByEmployeeMonthYear).mockResolvedValue(null);
			vi.mocked(dao.create).mockResolvedValue(mockPayrollRecord() as never);

			const result = await uploadPayroll(rows);

			expect(result.created).toBe(1);
			expect(result.skipped).toBe(1);
			expect(result.errors).toHaveLength(1);
		});

		it('should process multiple valid rows successfully', async () => {
			const rows = [
				mockParsedRow({ employee_code: 'EMP001', rowIndex: 2 }),
				mockParsedRow({ employee_code: 'EMP002', rowIndex: 3, month: 7 })
			];

			vi.mocked(findEmployeeByCode)
				.mockReturnValueOnce(mockEmployee({ cuid: 'EMP001', employee_id: 'EMP001' }))
				.mockReturnValueOnce(mockEmployee({ cuid: 'EMP002', employee_id: 'EMP002' }));
			vi.mocked(dao.findByEmployeeMonthYear).mockResolvedValue(null);
			vi.mocked(dao.create).mockResolvedValue(mockPayrollRecord() as never);

			const result = await uploadPayroll(rows);

			expect(result.created).toBe(2);
			expect(result.skipped).toBe(0);
			expect(result.errors).toHaveLength(0);
			expect(dao.create).toHaveBeenCalledTimes(2);
		});

		it('should use employee name from Excel if available, otherwise fallback to provider', async () => {
			vi.mocked(findEmployeeByCode).mockReturnValue(mockEmployee({ name: 'John Doe Provider' }));
			vi.mocked(dao.findByEmployeeMonthYear).mockResolvedValue(null);
			vi.mocked(dao.create).mockResolvedValue(mockPayrollRecord() as never);

			await uploadPayroll([mockParsedRow({ employee_name: 'John Doe Excel' })]);

			expect(dao.create).toHaveBeenCalledWith(
				expect.objectContaining({ employee_name: 'John Doe Excel' })
			);
		});

		it('should use provider name when Excel employee_name is empty', async () => {
			vi.mocked(findEmployeeByCode).mockReturnValue(mockEmployee({ name: 'John Doe Provider' }));
			vi.mocked(dao.findByEmployeeMonthYear).mockResolvedValue(null);
			vi.mocked(dao.create).mockResolvedValue(mockPayrollRecord() as never);

			await uploadPayroll([mockParsedRow({ employee_name: '' })]);

			expect(dao.create).toHaveBeenCalledWith(
				expect.objectContaining({ employee_name: 'John Doe Provider' })
			);
		});
	});

	// ─── getPayrolls ──────────────────────────────────────────────────────────

	describe('getPayrolls', () => {
		it('should return empty array when no records exist', async () => {
			vi.mocked(dao.findMany).mockResolvedValue([]);

			const result = await getPayrolls();

			expect(result).toEqual([]);
		});

		it('should return serialized payroll list', async () => {
			vi.mocked(dao.findMany).mockResolvedValue([mockPayrollRecord()] as never);

			const result = await getPayrolls();

			expect(result).toHaveLength(1);
			expect(result[0].cuid).toBe('pay_001');
			expect(typeof result[0].gross_earnings).toBe('number');
			expect(typeof result[0].net_salary).toBe('number');
		});
	});

	// ─── getPayrollByCuid ─────────────────────────────────────────────────────

	describe('getPayrollByCuid', () => {
		it('should return a serialized payroll record when found', async () => {
			vi.mocked(dao.findByCuid).mockResolvedValue(mockPayrollRecord() as never);

			const result = await getPayrollByCuid('pay_001');

			expect(result.cuid).toBe('pay_001');
			expect(result.employee_code).toBe('EMP001');
			expect(result.month).toBe(6);
			expect(result.year).toBe(2026);
		});

		it('should throw PayrollNotFoundError when record not found', async () => {
			vi.mocked(dao.findByCuid).mockResolvedValue(null);

			await expect(getPayrollByCuid('nonexistent')).rejects.toThrow(PayrollNotFoundError);
		});
	});
});
