import type { Payroll as PrismaPayroll } from '$lib/generated/prisma/client.js';
import type { Payroll } from '$lib/types/payroll.js';

/**
 * Serialize a Prisma Payroll record for JSON transport.
 * - Strips internal BigInt `id`
 * - Converts Decimal fields to numbers
 * - Converts DateTime fields to ISO strings
 * - Casts `payroll_breakdown` Json to Record<string, number>
 */
export function serializePayroll(record: PrismaPayroll): Payroll {
	return {
		cuid: record.cuid,
		employee_cuid: record.employee_cuid,
		employee_code: record.employee_code,
		employee_name: record.employee_name,
		month: record.month,
		year: record.year,
		gross_earnings: Number(record.gross_earnings),
		total_deduction: Number(record.total_deduction),
		net_salary: Number(record.net_salary),
		payroll_breakdown: record.payroll_breakdown as Record<string, number>,
		payroll_upload_cuid: record.payroll_upload_cuid ?? null,
		uploaded_at: record.uploaded_at.toISOString(),
		created_at: record.created_at.toISOString()
	};
}

/** Serialize a list of payroll records. */
export function serializePayrollList(records: PrismaPayroll[]): Payroll[] {
	return records.map(serializePayroll);
}
