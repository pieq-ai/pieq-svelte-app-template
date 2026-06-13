import * as uploadDao from '$lib/server/dao/payroll-upload.dao.js';
import * as failureDao from '$lib/server/dao/payroll-upload-failure.dao.js';
import {
	serializePayrollUpload,
	serializePayrollUploadList
} from '$lib/server/serializers/payroll-upload.serializer.js';
import {
	serializePayrollUploadFailureList
} from '$lib/server/serializers/payroll-upload-failure.serializer.js';

// ─── Custom error classes ─────────────────────────────────────────────────────

export class PayrollUploadNotFoundError extends Error {
	constructor(cuid: string) {
		super(`Payroll upload batch with ID "${cuid}" not found.`);
		this.name = 'PayrollUploadNotFoundError';
	}
}

// ─── Service operations ───────────────────────────────────────────────────────

/**
 * Retrieve all payroll upload batches, most recent first.
 */
export async function getPayrollUploads() {
	const records = await uploadDao.findMany();
	return serializePayrollUploadList(records);
}

/**
 * Retrieve a single payroll upload batch by its external cuid.
 * Throws PayrollUploadNotFoundError if not found.
 */
export async function getPayrollUploadByCuid(cuid: string) {
	const record = await uploadDao.findByCuid(cuid);
	if (!record) {
		throw new PayrollUploadNotFoundError(cuid);
	}
	return serializePayrollUpload(record);
}

/**
 * Retrieve all row-level failures for a payroll upload batch.
 */
export async function getPayrollUploadFailures(uploadCuid: string) {
	const records = await failureDao.findManyByUploadCuid(uploadCuid);
	return serializePayrollUploadFailureList(records);
}

