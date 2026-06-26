import { db } from '$lib/server/db.js';
import type { CreatePayrollUploadDto } from '$lib/types/payroll.js';
import type { Prisma } from '$lib/generated/prisma/client.js';

// ─── Single record queries ─────────────────────────────────────────────────────

/** Create a new payroll upload batch record. */
export async function create(data: CreatePayrollUploadDto, tx?: Prisma.TransactionClient) {
	const client = tx ?? db;
	return client.payrollUpload.create({
		data: {
			month: data.month,
			year: data.year,
			status: data.status ?? 'processed',
			file_name: data.file_name ?? null,
			errors: data.errors ?? null,
			created_by: data.created_by ?? null
		}
	});
}

/** Find a payroll upload record by its external cuid. */
export async function findByCuid(cuid: string) {
	const record = await db.payrollUpload.findUnique({ where: { cuid } });
	if (!record) return null;

	const failureCount = await db.payrollUploadRecord.count({
		where: { payroll_upload_cuid: cuid, status: 'failed' }
	});

	return {
		...record,
		failure_count: failureCount
	};
}

/** Update the employee_count, status, and errors after processing. */
export async function updateEmployeeCount(
	cuid: string,
	employee_count: number,
	status?: string,
	errors?: string | null,
	tx?: Prisma.TransactionClient
) {
	const client = tx ?? db;
	return client.payrollUpload.update({
		where: { cuid },
		data: {
			employee_count,
			...(status ? { status } : {}),
			...(errors !== undefined ? { errors } : {})
		}
	});
}

// ─── List queries ─────────────────────────────────────────────────────────────

/** Fetch all payroll upload batches, most recent first. */
export async function findMany() {
	const uploads = await db.payrollUpload.findMany({
		orderBy: [{ uploaded_at: 'desc' }]
	});

	const failureGroups = await db.payrollUploadRecord.groupBy({
		by: ['payroll_upload_cuid'],
		where: { status: 'failed' },
		_count: {
			id: true
		}
	});

	const failureMap = new Map<string, number>(
		failureGroups.map((g) => [g.payroll_upload_cuid, g._count.id])
	);

	return uploads.map((u) => ({
		...u,
		failure_count: failureMap.get(u.cuid) ?? 0
	}));
}
