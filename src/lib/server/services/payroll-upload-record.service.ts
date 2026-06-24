import * as recordDao from '$lib/server/dao/payroll-upload-record.dao.js';
import { serializePayrollUploadRecordAsFailure } from '$lib/server/serializers/payroll-upload-record.serializer.js';

/**
 * Fetch a single failure record by its external CUID.
 * Returns the serialized failure DTO or null if not found.
 */
export async function getFailureByCuid(cuid: string) {
	const record = await recordDao.findByCuid(cuid);
	if (!record || record.status !== 'failed') return null;
	return serializePayrollUploadRecordAsFailure(record);
}
