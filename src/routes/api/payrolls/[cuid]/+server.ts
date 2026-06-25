import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/payroll.service.js';
import * as failureService from '$lib/server/services/payroll-upload-record.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event) {
	const params = event.params;
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'payroll_view');
		const payroll = await service.getPayrollByCuid(params.cuid);
		return json({ data: payroll });
	} catch (error) {
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
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
			return json({ message }, { status: 404 });
		}
		console.error(`Error in GET /api/payrolls/${params.cuid}:`, error);
		return json(
			{ message: message || 'Failed to retrieve payroll record' },
			{ status: 500 }
		);
	}
}
