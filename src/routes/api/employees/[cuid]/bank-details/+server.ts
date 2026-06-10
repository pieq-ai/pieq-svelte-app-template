import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as bankDetailService from '$lib/server/services/bank-detail.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const bankDetails = await bankDetailService.getBankDetailsByEmployeeCuid(employee_cuid);
		return json({ data: bankDetails });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
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

		const bankDetails = await bankDetailService.replaceBankDetails(employee_cuid, body);
		return json({ data: bankDetails, message: 'Successfully updated bank details' });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
