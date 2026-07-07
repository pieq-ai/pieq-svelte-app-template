import { requirePermission } from "$lib/server/guards/permission.guard";
import { json, type RequestEvent } from "@sveltejs/kit";
import * as payrollService from "$lib/server/services/payroll.service.js";
import * as uploadService from "$lib/server/services/payroll-upload.service.js";

/**
 * GET /api/payroll-uploads/:cuid/records
 *
 * Returns all employee payroll records belonging to a specific upload batch.
 */
export async function GET({ locals, params }: RequestEvent) {
  try {
    requirePermission(locals.user, "payroll:view");
		const cuid = params.cuid;
		if (!cuid) {
			return json({ error: 'CUID is required' }, { status: 400 });
		}
    // Verify the upload exists first — returns 404 if not found
    await uploadService.getPayrollUploadByCuid(cuid);

		const records = await payrollService.getPayrollsByUploadCuid(cuid);
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
