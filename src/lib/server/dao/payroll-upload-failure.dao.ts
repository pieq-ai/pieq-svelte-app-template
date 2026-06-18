import { db } from '$lib/server/db.js';

interface CreatePayrollUploadFailureDto {
	payroll_upload_cuid: string;
	row_number: number;
	employee_code: string | null;
	error_type: string;
	error_message: string;
}

/** Create a new payroll upload failure record. */
export async function create(data: CreatePayrollUploadFailureDto) {
	return db.payrollUploadFailure.create({
		data: {
			payroll_upload_cuid: data.payroll_upload_cuid,
			row_number: data.row_number,
			employee_code: data.employee_code ?? null,
			error_type: data.error_type,
			error_message: data.error_message
		}
	});
}

/** Fetch all row-level failures for a specific upload batch. */
export async function findManyByUploadCuid(payroll_upload_cuid: string) {
	return db.payrollUploadFailure.findMany({
		where: { payroll_upload_cuid },
		orderBy: [{ row_number: 'asc' }]
	});
}

/** Fetch a single failure record by its external cuid. */
export async function findByCuid(cuid: string) {
	return db.payrollUploadFailure.findUnique({
		where: { cuid }
	});
}

