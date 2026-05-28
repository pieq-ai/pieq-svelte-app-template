import * as permissionDao from '$lib/server/dao/permission.dao.js';
import * as rolePermissionDao from '$lib/server/dao/role-permission.dao.js';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';

export interface AssignRolePermissionsDto {
	system_role_id: number;
	permission_ids: number[];
}

function validatePositiveId(value: number, label: string) {
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${label} must be a positive integer`);
	}
}

function getPermissionModule(permissionKey: string) {
	return permissionKey.split('_')[0] || 'general';
}

export async function getRolePermissionMatrix() {
	const [roles, permissions, mappings] = await Promise.all([
		systemRoleDao.list(),
		permissionDao.list(),
		rolePermissionDao.list()
	]);

	const roleById = new Map(roles.map((role) => [role.system_role_id, role]));
	const permissionById = new Map(
		permissions.map((permission) => [permission.permission_id, permission])
	);

	const enrichedMappings = mappings.map((mapping) => ({
		...mapping,
		role: roleById.get(mapping.system_role_id) ?? null,
		permission: permissionById.get(mapping.permission_id) ?? null
	}));

	const groupedPermissions = permissions.reduce(
		(groups, permission) => {
			const moduleName = getPermissionModule(permission.permission_key);
			groups[moduleName] = [...(groups[moduleName] ?? []), permission];
			return groups;
		},
		{} as Record<string, typeof permissions>
	);

	return {
		roles,
		permissions,
		groupedPermissions,
		mappings: enrichedMappings
	};
}

export async function assignPermissionsToRole(dto: AssignRolePermissionsDto) {
	validatePositiveId(dto.system_role_id, 'System role ID');

	if (!Array.isArray(dto.permission_ids) || dto.permission_ids.length === 0) {
		throw new Error('At least one permission is required');
	}

	const role = await systemRoleDao.findById(dto.system_role_id);
	if (!role) {
		throw new Error('System role not found');
	}

	const uniquePermissionIds = [...new Set(dto.permission_ids.map(Number))];
	const created = [];
	const skipped = [];

	for (const permission_id of uniquePermissionIds) {
		validatePositiveId(permission_id, 'Permission ID');

		const permission = await permissionDao.findById(permission_id);
		if (!permission) {
			throw new Error(`Permission with ID "${permission_id}" not found`);
		}

		const existing = await rolePermissionDao.findByRoleAndPermission(
			dto.system_role_id,
			permission_id
		);
		if (existing) {
			skipped.push(existing);
			continue;
		}

		created.push(
			await rolePermissionDao.create({
				system_role_id: dto.system_role_id,
				permission_id
			})
		);
	}

	return {
		created,
		skipped
	};
}

export async function removePermissionFromRole(system_role_id: number, permission_id: number) {
	validatePositiveId(system_role_id, 'System role ID');
	validatePositiveId(permission_id, 'Permission ID');

	const existing = await rolePermissionDao.findByRoleAndPermission(system_role_id, permission_id);
	if (!existing) {
		throw new Error('Role permission mapping not found');
	}

	return rolePermissionDao.removeByRoleAndPermission(system_role_id, permission_id);
}
