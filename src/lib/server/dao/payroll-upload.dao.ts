import { db } from '$lib/server/db.js';
import type { CreatePayrollUploadDto } from '$lib/types/payroll.js';

// ─── Single record queries ─────────────────────────────────────────────────────

/** Create a new payroll upload batch record. */
export async function create(data: CreatePayrollUploadDto) {
	return db.payrollUpload.create({
		data: {
			month: data.month,
			year: data.year,
			status: data.status ?? 'processed',
			file_name: data.file_name ?? null,
			failure_reason: data.failure_reason ?? null,
			created_by: data.created_by ?? null
		}
	});
}

/** Find a payroll upload record by its external cuid. */
export async function findByCuid(cuid: string) {
	return db.payrollUpload.findUnique({ where: { cuid } });
}

/** Update the employee_count, status, and failure_reason after processing. */
export async function updateEmployeeCount(
	cuid: string,
	employee_count: number,
	status?: string,
	failure_reason?: string | null
) {
	return db.payrollUpload.update({
		where: { cuid },
		data: {
			employee_count,
			...(status ? { status } : {}),
			...(failure_reason !== undefined ? { failure_reason } : {})
		}
	});
}

// ─── List queries ─────────────────────────────────────────────────────────────

/** Fetch all payroll upload batches, most recent first. */
export async function findMany() {
	return db.payrollUpload.findMany({
		orderBy: [{ uploaded_at: 'desc' }]
	});
}
