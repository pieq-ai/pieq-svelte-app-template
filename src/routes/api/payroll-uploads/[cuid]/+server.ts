import { json, type RequestEvent } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';
import * as payrollService from '$lib/server/services/payroll.service.js';

/** GET /api/payroll-uploads/:cuid — returns a single upload batch with its records and failures. */
export async function GET({ params }: RequestEvent) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json({ error: 'CUID is required' }, { status: 400 });
		}
		const upload = await service.getPayrollUploadByCuid(cuid);
		const records = await payrollService.getPayrollsByUploadCuid(cuid);
		const failures = await service.getPayrollUploadFailures(cuid);

		return json({
			data: {
				...upload,
				records,
				failures
			}
		});
	} catch (error) {
		if ((error as Error).name === 'PayrollUploadNotFoundError') {
			return json({ message: (error as Error).message }, { status: 404 });
		}
		console.error(`Error in GET /api/payroll-uploads/${params.cuid}:`, error);
		return json(
			{ message: (error as Error).message || 'Failed to retrieve payroll upload record' },
			{ status: 500 }
		);
	}
}
