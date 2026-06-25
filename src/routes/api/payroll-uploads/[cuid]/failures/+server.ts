import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/**
 * GET /api/payroll-uploads/:cuid/failures
 *
 * Returns all row-level failures (and prepended upload-level failure if present)
 * belonging to a specific upload batch.
 */
export async function GET(event) {
	const params = event.params;
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'payroll_view');
		// Verify the upload exists first — returns 404 if not found
		await service.getPayrollUploadByCuid(params.cuid);

		const failures = await service.getPayrollUploadFailures(params.cuid);

		return json({ data: failures });
	} catch (error) {
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
		if ((error as Error).name === 'PayrollUploadNotFoundError') {
			return json({ message }, { status: 404 });
		}
		console.error(`Error in GET /api/payroll-uploads/${params.cuid}/failures:`, error);
		return json(
			{ message: message || 'Failed to retrieve payroll failures' },
			{ status: 500 }
		);
	}
}
