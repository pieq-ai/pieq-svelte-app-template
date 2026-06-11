import { json } from '@sveltejs/kit';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent) {
    try {
        permissionGuard.requireAuth(event.locals.user);
        const nextCode = await employeeService.generateNextEmployeeCode();
        return json({ data: nextCode });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
