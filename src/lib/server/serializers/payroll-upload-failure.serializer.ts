import type { PayrollUploadFailure as PrismaPayrollUploadFailure } from '$lib/generated/prisma/client.js';
import type { PayrollUploadFailure } from '$lib/types/payroll.js';

/**
 * Serialize a Prisma PayrollUploadFailure record for JSON transport.
 * - Strips internal BigInt `id`
 * - Converts DateTime fields to ISO strings
 */
export function serializePayrollUploadFailure(record: PrismaPayrollUploadFailure): PayrollUploadFailure {
	return {
		cuid: record.cuid,
		payroll_upload_cuid: record.payroll_upload_cuid,
		row_number: record.row_number,
		employee_code: record.employee_code,
		error_type: record.error_type,
		error_message: record.error_message
	};
}

/** Serialize a list of payroll upload failure records. */
export function serializePayrollUploadFailureList(records: PrismaPayrollUploadFailure[]): PayrollUploadFailure[] {
	return records.map(serializePayrollUploadFailure);
}
