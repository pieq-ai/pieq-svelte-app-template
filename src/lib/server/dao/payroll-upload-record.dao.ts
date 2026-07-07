import { db } from '$lib/server/db.js';
import type { Prisma } from '$lib/generated/prisma/client.js';

interface CreateRecordInput {
	payroll_upload_cuid: string;
	row_number: number;
	employee_code: string | null;
	employee_name: string | null;
	status: string;
	row_data: any;
	errors?: any;
}

/** Create a new payroll upload record. */
export async function create(data: CreateRecordInput, tx?: Prisma.TransactionClient) {
	const client = tx ?? db;
	return client.payrollUploadRecord.create({
		data: {
			payroll_upload_cuid: data.payroll_upload_cuid,
			row_number: data.row_number,
			employee_code: data.employee_code,
			employee_name: data.employee_name,
			status: data.status,
			row_data: data.row_data,
			errors: data.errors ?? null
		}
	});
}

/** Fetch all row-level records for a specific upload batch. */
export async function findManyByUploadCuid(payroll_upload_cuid: string) {
	return db.payrollUploadRecord.findMany({
		where: { payroll_upload_cuid },
		orderBy: [{ row_number: 'asc' }]
	});
}

/** Fetch a single record by its external cuid. */
export async function findByCuid(cuid: string) {
	return db.payrollUploadRecord.findUnique({
		where: { cuid }
	});
}
