import * as failureDao from '$lib/server/dao/payroll-upload-failure.dao.js';
import { serializePayrollUploadFailure } from '$lib/server/serializers/payroll-upload-failure.serializer.js';

/**
 * Fetch a single failure record by its external CUID.
 * Returns the serialized failure DTO or null if not found.
 */
export async function getFailureByCuid(cuid: string) {
	const record = await failureDao.findByCuid(cuid);
	return record ? serializePayrollUploadFailure(record) : null;
}
