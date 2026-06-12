import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll-upload.service.js';

/** GET /api/payroll-uploads/:cuid — returns a single upload batch. */
export async function GET({ params }) {
	try {
		const upload = await service.getPayrollUploadByCuid(params.cuid);
		return json({ data: upload });
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
