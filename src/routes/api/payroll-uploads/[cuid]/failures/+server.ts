import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';

/**
 * GET /api/payroll-uploads/:cuid/failures
 *
 * Returns all row-level failures (and prepended upload-level failure if present)
 * belonging to a specific upload batch.
 */
export async function GET({ params }) {
	try {
		// Verify the upload exists first — returns 404 if not found
		const upload = await service.getPayrollUploadByCuid(params.cuid);

		const failures = await service.getPayrollUploadFailures(params.cuid);

		// If there is an upload-level validation failure reason, prepend it as a synthetic failure
		if (upload.failure_reason) {
			failures.unshift({
				cuid: 'synthetic',
				payroll_upload_cuid: upload.cuid,
				row_number: 0, // indicates upload-level / no row
				employee_code: null,
				error_type: 'Validation Error',
				error_message: upload.failure_reason,
				created_at: upload.created_at
			});
		}

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
