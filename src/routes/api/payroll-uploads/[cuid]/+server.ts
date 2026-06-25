import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';
import * as payrollService from '$lib/server/services/payroll.service.js';

/** GET /api/payroll-uploads/:cuid — returns a single upload batch with its records and failures. */
export async function GET({ params }) {
	try {
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
