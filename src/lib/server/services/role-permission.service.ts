import * as permissionDao from '$lib/server/dao/permission.dao.js';
import * as rolePermissionDao from '$lib/server/dao/role-permission.dao.js';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';

export interface AssignRolePermissionsDto {
	system_role_cuid2: string;
	permission_cuid2s: string[];
}

function validateCuid2(value: string | undefined, label: string) {
	if (!value || typeof value !== 'string') {
		throw new Error(`${label} CUID2 is required`);
	}
}

function getPermissionModule(permissionKey: string) {
	return permissionKey.split('_')[0] || 'general';
}

function toPublicPermission(permission: {
	cuid2: string;
	permission_key: string;
	status: boolean;
}) {
	return {
		cuid2: permission.cuid2,
		permission_key: permission.permission_key,
		status: permission.status
	};
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
		cuid2: mapping.cuid2,
		system_role_cuid2: roleById.get(mapping.system_role_id)?.cuid2 ?? null,
		permission_cuid2: permissionById.get(mapping.permission_id)?.cuid2 ?? null
	}));

	const groupedPermissions = permissions.reduce(
		(groups, permission) => {
			const moduleName = getPermissionModule(permission.permission_key);
			groups[moduleName] = [...(groups[moduleName] ?? []), toPublicPermission(permission)];
			return groups;
		},
		{} as Record<string, ReturnType<typeof toPublicPermission>[]>
	);

	return {
		roles: roles.map(({ cuid2, system_role_name, status }) => ({
			cuid2,
			system_role_name,
			status
		})),
		permissions: permissions.map(toPublicPermission),
		groupedPermissions,
		mappings: enrichedMappings
	};
}

export async function assignPermissionsToRole(dto: AssignRolePermissionsDto) {
	validateCuid2(dto.system_role_cuid2, 'System role');

	if (!Array.isArray(dto.permission_cuid2s) || dto.permission_cuid2s.length === 0) {
		throw new Error('At least one permission is required');
	}

	const role = await systemRoleDao.findByCuid2(dto.system_role_cuid2);
	if (!role) {
		throw new Error('System role not found');
	}

	const uniquePermissionCuid2s = [...new Set(dto.permission_cuid2s)];
	const created = [];
	const skipped = [];

	for (const permission_cuid2 of uniquePermissionCuid2s) {
		validateCuid2(permission_cuid2, 'Permission');

		const permission = await permissionDao.findByCuid2(permission_cuid2);
		if (!permission) {
			throw new Error(`Permission with CUID2 "${permission_cuid2}" not found`);
		}

		const existing = await rolePermissionDao.findByRoleAndPermission(
			role.system_role_id,
			permission.permission_id
		);
		if (existing) {
			skipped.push(existing);
			continue;
		}

		created.push(
			await rolePermissionDao.create({
				system_role_id: role.system_role_id,
				permission_id: permission.permission_id
			})
		);
	}

	return {
		created,
		skipped
	};
}

export async function removePermissionFromRoleByCuid2(system_role_cuid2: string, permission_cuid2: string) {
	validateCuid2(system_role_cuid2, 'System role');
	validateCuid2(permission_cuid2, 'Permission');

	const role = await systemRoleDao.findByCuid2(system_role_cuid2);
	if (!role) {
		throw new Error('System role not found');
	}

	const permission = await permissionDao.findByCuid2(permission_cuid2);
	if (!permission) {
		throw new Error('Permission not found');
	}

	const existing = await rolePermissionDao.findByRoleAndPermission(role.system_role_id, permission.permission_id);
	if (!existing) {
		throw new Error('Role permission mapping not found');
	}

	return rolePermissionDao.removeByRoleAndPermission(role.system_role_id, permission.permission_id);
}
