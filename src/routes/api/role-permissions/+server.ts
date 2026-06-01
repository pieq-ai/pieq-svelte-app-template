import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import * as rolePermissionService from '$lib/server/services/role-permission.service.js';
import { mapToDb, toPermissionDTO, toRolePermissionDTO, toSystemRoleDTO } from '$lib/server/utils/mapping.js';

function getStatus(message: string) {
	if (message === 'Unauthorized') return 401;
	if (message.includes('not found')) return 404;
	return 400;
}

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const matrix = await rolePermissionService.getRolePermissionMatrix();
		return json({
			data: {
				roles: matrix.roles.map(toSystemRoleDTO),
				permissions: matrix.permissions.map(toPermissionDTO),
				mappings: matrix.mappings.map(toRolePermissionDTO),
				groupedPermissions: Object.fromEntries(
					Object.entries(matrix.groupedPermissions).map(([key, group]) => [
						key,
						group.map(toPermissionDTO)
					])
				)
			}
		});
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		let body = await event.request.json();
		body = mapToDb(body);
		body.created_by = event.locals.user?.id;
		await rolePermissionService.assignPermissionsToRole(body);
		return json({ data: { message: 'Successfully assigned permissions' } }, { status: 201 });
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: getStatus(message) });
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const url = new URL(event.request.url);
		const systemRoleCuid = url.searchParams.get('roleCuid') ?? '';
		const permissionCuid = url.searchParams.get('permissionCuid') ?? '';
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
