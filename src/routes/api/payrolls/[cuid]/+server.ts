import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll.service.js';

export async function GET({ params }) {
	try {
		const payroll = await service.getPayrollByCuid(params.cuid);
		return json({ data: payroll });
	} catch (error) {
		if ((error as Error).name === 'PayrollNotFoundError') {
			return json({ message: (error as Error).message }, { status: 404 });
		}
		console.error(`Error in GET /api/payrolls/${params.cuid}:`, error);
		return json(
			{ message: (error as Error).message || 'Failed to retrieve payroll record' },
			{ status: 500 }
		);
	}
}
