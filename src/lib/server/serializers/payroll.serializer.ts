import type { Payroll as PrismaPayroll } from '$lib/generated/prisma/client.js';
import type { Payroll, PayrollEmployeeDetails } from '$lib/types/payroll.js';
import { getEarningsAndDeductions, numberToWords } from '$lib/utils/payroll.js';

/**
 * Serialize a Prisma Payroll record for JSON transport.
 * - Strips internal BigInt `id`
 * - Converts Decimal fields to numbers
 * - Converts DateTime fields to ISO strings
 * - Casts `breakdown` Json to Record<string, number>
 * - Optionally attaches `employee_details` if provided by the service layer
 */
export function serializePayroll(
	record: PrismaPayroll & { employee_code: string; employee_name: string },
	employeeDetails?: PayrollEmployeeDetails
): Payroll {
	const breakdown = record.breakdown as Record<string, number>;
	const net_salary = Number(record.net_salary);

	let earnings: [string, number][] | undefined;
	let deductions: [string, number][] | undefined;
	let net_salary_words: string | undefined;

	if (employeeDetails !== undefined) {
		const classified = getEarningsAndDeductions(breakdown);
		earnings = classified.earnings;
		deductions = classified.deductions;
		net_salary_words = numberToWords(net_salary);
	}

	return {
		cuid: record.cuid,
		employee_cuid: record.employee_cuid,
		employee_code: record.employee_code,
		employee_name: record.employee_name,
		month: record.month,
		year: record.year,
		gross_earnings: Number(record.gross_earnings),
		total_deduction: Number(record.total_deduction),
		net_salary,
		breakdown,
		payroll_upload_cuid: record.payroll_upload_cuid ?? null,
		uploaded_at: record.uploaded_at.toISOString(),
		...(employeeDetails !== undefined ? { employee_details: employeeDetails } : {}),
		...(earnings !== undefined ? { earnings } : {}),
		...(deductions !== undefined ? { deductions } : {}),
		...(net_salary_words !== undefined ? { net_salary_words } : {})
	};
}

/** Serialize a list of payroll records. */
export function serializePayrollList(
	records: (PrismaPayroll & { employee_code: string; employee_name: string })[]
): Payroll[] {
	return records.map((r) => serializePayroll(r));
}
