import { json, type RequestEvent } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';

/**
 * GET /api/payroll-uploads/:cuid/failures
 *
 * Returns all row-level failures (and prepended upload-level failure if present)
 * belonging to a specific upload batch.
 */
export async function GET({ params }: RequestEvent) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json({ error: 'CUID is required' }, { status: 400 });
		}
		// Verify the upload exists first — returns 404 if not found
		await service.getPayrollUploadByCuid(cuid);

		const failures = await service.getPayrollUploadFailures(cuid);

		return json({ data: failures });
	} catch (error) {
		if ((error as Error).name === 'PayrollUploadNotFoundError') {
			return json({ message: (error as Error).message }, { status: 404 });
		}
		console.error(`Error in GET /api/payroll-uploads/${params.cuid}/failures:`, error);
		return json(
			{ message: (error as Error).message || 'Failed to retrieve payroll failures' },
			{ status: 500 }
		);
	}
}
