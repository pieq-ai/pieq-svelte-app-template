import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll.service.js';
import * as failureService from '$lib/server/services/payroll-upload-record.service.js';
import { db } from '$lib/server/db.js';

export async function GET({ params }) {
	try {
		// Check if the provided cuid belongs to an employee
		const employee = await db.employee.findUnique({
			where: { cuid: params.cuid }
		});

		if (employee) {
			// Find the latest payroll record for this employee
			const latestPayroll = await db.payroll.findFirst({
				where: { employee_cuid: params.cuid },
				orderBy: [{ year: 'desc' }, { month: 'desc' }]
			});
			if (!latestPayroll) {
				return json(
					{ message: 'No payroll records found for this employee' },
					{ status: 404 }
				);
			}
			const payroll = await service.getPayrollByCuid(latestPayroll.cuid);
			return json({ data: payroll });
		}

		const payroll = await service.getPayrollByCuid(params.cuid);
		return json({ data: payroll });
	} catch (error) {
		if ((error as Error).name === 'PayrollNotFoundError') {
			try {
				const failure = await failureService.getFailureByCuid(params.cuid);
				if (failure) {
					return json({
						data: {
							cuid: failure.cuid,
							status: 'Failed',
							error_type: failure.error_type,
							error_message: failure.error_message,
							row_number: failure.row_number,
							employee_code: failure.employee_code || '-',
							payroll_upload_cuid: failure.payroll_upload_cuid,
							isFailure: true
						}
					});
				}
			} catch (dbErr) {
				console.error('Failed to look up failure record:', dbErr);
			}
			return json({ message: (error as Error).message }, { status: 404 });
		}
		console.error(`Error in GET /api/payrolls/${params.cuid}:`, error);
		return json(
			{ message: (error as Error).message || 'Failed to retrieve payroll record' },
			{ status: 500 }
		);
	}
}
