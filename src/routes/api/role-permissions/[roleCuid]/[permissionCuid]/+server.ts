import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as rolePermissionService from '$lib/server/services/role-permission.service.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requirePermission(event.locals.user, 'role_permission:view');
		const systemRoleCuid = event.params.roleCuid ?? '';
		const permissionCuid = event.params.permissionCuid ?? '';
		
		await rolePermissionService.removePermissionFromRoleByCuid2(
			systemRoleCuid,
			permissionCuid
		);
		return json({ data: { message: 'Successfully removed permission' } });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}
