import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';
import * as payrollService from '$lib/server/services/payroll.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/** GET /api/payroll-uploads/:cuid — returns a single upload batch with its records and failures. */
export async function GET(event) {
	const params = event.params;
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'payroll_view');
		const upload = await service.getPayrollUploadByCuid(params.cuid);
		const records = await payrollService.getPayrollsByUploadCuid(params.cuid);
		const failures = await service.getPayrollUploadFailures(params.cuid);

		return json({
			data: {
				...upload,
				records,
				failures
			}
		});
	} catch (error) {
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
		if ((error as Error).name === 'PayrollUploadNotFoundError') {
			return json({ message }, { status: 404 });
		}
		console.error(`Error in GET /api/payroll-uploads/${params.cuid}:`, error);
		return json(
			{ message: message || 'Failed to retrieve payroll upload record' },
			{ status: 500 }
		);
	}
}
