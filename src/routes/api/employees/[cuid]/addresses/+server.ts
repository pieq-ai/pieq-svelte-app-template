import type { RequestEvent } from './$types';
import * as addressService from '$lib/server/services/address.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { sendList, sendUpdated, handleError } from '$lib/server/utils/response.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const addresses = await addressService.getAddressesByEmployeeCuid(employee_cuid);
		return sendList(addresses);
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
        
        // Inject updated_by into each record
        const user_id = event.locals.user?.id;
        body = body.map((addr: Record<string, unknown>) => ({ ...addr, updated_by: user_id }));

		await addressService.replaceAddresses(employee_cuid, body);
		return sendUpdated(employee_cuid, 'Successfully updated addresses');
	} catch (error) {
		return handleError(error);
	}
}
