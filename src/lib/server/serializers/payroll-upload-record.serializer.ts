import type { PayrollUploadRecord as PrismaPayrollUploadRecord } from '$lib/generated/prisma/client.js';
import type { PayrollUploadFailure } from '$lib/types/payroll.js';

export interface PayrollUploadRecord {
	cuid: string;
	payroll_upload_cuid: string;
	row_number: number;
	employee_code: string | null;
	employee_name: string | null;
	status: string;
	row_data: any;
	errors: any;
	created_at: string;
}

export function serializePayrollUploadRecord(record: PrismaPayrollUploadRecord): PayrollUploadRecord {
	return {
		cuid: record.cuid,
		payroll_upload_cuid: record.payroll_upload_cuid,
		row_number: record.row_number,
		employee_code: record.employee_code,
		employee_name: record.employee_name,
		status: record.status,
		row_data: record.row_data,
		errors: record.errors,
		created_at: record.created_at.toISOString()
	};
}

export function serializePayrollUploadRecordAsFailure(record: PrismaPayrollUploadRecord): PayrollUploadFailure {
	const errorsObj = (record.errors as Record<string, string>) || {};
	const errorMessages = Object.values(errorsObj).join(', ');

	return {
		cuid: record.cuid,
		payroll_upload_cuid: record.payroll_upload_cuid,
		row_number: record.row_number,
		employee_code: record.employee_code,
		error_type: 'Validation Error',
		error_message: errorMessages || 'Unknown processing error'
	};
}

export function serializePayrollUploadRecordAsFailureList(records: PrismaPayrollUploadRecord[]): PayrollUploadFailure[] {
	return records.map(serializePayrollUploadRecordAsFailure);
}
