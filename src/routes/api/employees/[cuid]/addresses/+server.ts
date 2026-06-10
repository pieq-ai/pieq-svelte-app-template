import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as addressService from '$lib/server/services/address.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const employee_cuid = event.params.cuid;
		if (!employee_cuid) throw new Error('CUID2 parameter is missing');

		const addresses = await addressService.getAddressesByEmployeeCuid(employee_cuid);
		return json({ data: addresses });
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
        
        // Inject updated_by into each record
        const user_id = event.locals.user?.id;
        body = body.map((addr: any) => ({ ...addr, updated_by: user_id }));

		const addresses = await addressService.replaceAddresses(employee_cuid, body);
		return json({ data: addresses, message: 'Successfully updated addresses' });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
		return json({ error: message }, { status });
	}
}
