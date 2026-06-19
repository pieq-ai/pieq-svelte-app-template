import type { PayrollUpload as PrismaPayrollUpload } from '$lib/generated/prisma/client.js';
import type { PayrollUpload } from '$lib/types/payroll.js';

/**
 * Serialize a Prisma PayrollUpload record for JSON transport.
 * - Strips internal BigInt `id`
 * - Converts DateTime fields to ISO strings
 */
export function serializePayrollUpload(record: PrismaPayrollUpload & { failure_count?: number }): PayrollUpload {
	return {
		cuid: record.cuid,
		month: record.month,
		year: record.year,
		success_count: record.employee_count,
		failure_count: record.failure_count ?? 0,
		status: record.status,
		file_name: record.file_name,
		failure_reason: record.failure_reason,
		uploaded_at: record.uploaded_at.toISOString()
	};
}

/** Serialize a list of payroll upload records. */
export function serializePayrollUploadList(records: (PrismaPayrollUpload & { failure_count?: number })[]): PayrollUpload[] {
	return records.map(serializePayrollUpload);
}
