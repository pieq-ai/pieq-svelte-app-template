import type { RequestEvent } from '@sveltejs/kit';
import * as bankDetailService from '$lib/server/services/bank-detail.service.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { sendList, sendUpdated, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const bankDetails = await bankDetailService.getBankDetailsByEmployeeCuid(employee_cuid);
		return sendList(bankDetails);
	} catch (error) {
		return handleError(error);
	}
}

export async function PUT(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		let body = await event.request.json();
        if (!Array.isArray(body)) {
            body = [body];
        }
        
        const user_id = event.locals.user?.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body = body.map((bank: any) => ({ ...bank, updated_by: user_id }));

		await bankDetailService.replaceBankDetails(employee_cuid, body);
        await employeeService.checkAndSetProfileCompletionStatus(employee_cuid);
		return sendUpdated(employee_cuid, 'Successfully updated bank details');
	} catch (error) {
		return handleError(error);
	}
}
