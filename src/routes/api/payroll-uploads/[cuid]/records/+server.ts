import { requirePermission } from '$lib/server/authz/guards';
import { json } from '@sveltejs/kit';
import * as payrollService from '$lib/server/services/payroll.service.js';
import * as uploadService from '$lib/server/services/payroll-upload.service.js';

/**
 * GET /api/payroll-uploads/:cuid/records
 *
 * Returns all employee payroll records belonging to a specific upload batch.
 */
export async function GET({ params }) {
	try {
		
		requirePermission(locals.user, 'payroll:view');
// Verify the upload exists first — returns 404 if not found
		await uploadService.getPayrollUploadByCuid(params.cuid);

		const records = await payrollService.getPayrollsByUploadCuid(params.cuid);
		return json({ data: records });
	} catch (error) {
		if ((error as Error).name === 'PayrollUploadNotFoundError') {
			return json({ message: (error as Error).message }, { status: 404 });
		}
		console.error(`Error in GET /api/payroll-uploads/${params.cuid}/records:`, error);
		return json(
			{ message: (error as Error).message || 'Failed to retrieve payroll records' },
			{ status: 500 }
		);
	}
}
