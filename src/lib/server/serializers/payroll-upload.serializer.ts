import type { PayrollUpload as PrismaPayrollUpload } from '$lib/generated/prisma/client.js';
import type { PayrollUpload } from '$lib/types/payroll.js';

/**
 * Serialize a Prisma PayrollUpload record for JSON transport.
 * - Strips internal BigInt `id`
 * - Converts DateTime fields to ISO strings
 */
export function serializePayrollUpload(record: PrismaPayrollUpload): PayrollUpload {
	return {
		cuid: record.cuid,
		month: record.month,
		year: record.year,
		employee_count: record.employee_count,
		status: record.status,
		uploaded_at: record.uploaded_at.toISOString(),
		created_at: record.created_at.toISOString()
	};
}

/** Serialize a list of payroll upload records. */
export function serializePayrollUploadList(records: PrismaPayrollUpload[]): PayrollUpload[] {
	return records.map(serializePayrollUpload);
}
