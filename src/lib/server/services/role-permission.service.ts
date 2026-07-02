import * as permissionDao from '$lib/server/dao/permission.dao.js';
import * as rolePermissionDao from '$lib/server/dao/role-permission.dao.js';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';

export interface AssignRolePermissionsDto {
	system_role_cuid: string;
	permission_cuids: string[];
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
	cuid: string;
	permission_key: string;
	status: boolean;
 created_at: Date; created_by: string | null; updated_at: Date; updated_by: string | null; }) {
	return {
		cuid: permission.cuid,
		permission_key: permission.permission_key,
		status: permission.status
	,
		created_at: permission.created_at,
		created_by: permission.created_by,
		updated_at: permission.updated_at,
		updated_by: permission.updated_by
	};
}

export async function getRolePermissionMatrix() {
	const [roles, permissions, mappings] = await Promise.all([
		systemRoleDao.list(),
		permissionDao.list(),
		rolePermissionDao.list()
	]);

		const enrichedMappings = mappings.map((mapping) => ({
		cuid: mapping.cuid,
		system_role_cuid: mapping.system_role_cuid,
		permission_cuid: mapping.permission_cuid
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
		roles: roles.map(({ cuid, name, status, created_at, created_by, updated_at, updated_by }) => ({
			cuid,
			name,
			status,
			created_at,
			created_by,
			updated_at,
			updated_by
		})),
		permissions: permissions.map(toPublicPermission),
		groupedPermissions,
		mappings: enrichedMappings
	};
}

export async function assignPermissionsToRole(dto: AssignRolePermissionsDto) {
	validateCuid2(dto.system_role_cuid, 'System role');

	if (!Array.isArray(dto.permission_cuids) || dto.permission_cuids.length === 0) {
		throw new Error('At least one permission is required');
	}

	const role = await systemRoleDao.findByCuid2(dto.system_role_cuid);
	if (!role) {
		throw new Error('System role not found');
	}

	const uniquePermissionCuid2s = [...new Set(dto.permission_cuids)];
	const created = [];
	const skipped = [];

	for (const permission_cuid of uniquePermissionCuid2s) {
		validateCuid2(permission_cuid, 'Permission');

		const permission = await permissionDao.findByCuid2(permission_cuid);
		if (!permission) {
			throw new Error(`Permission with CUID2 "${permission_cuid}" not found`);
		}

		const existing = await rolePermissionDao.findByRoleAndPermission(
			role.cuid,
			permission.cuid
		);
		if (existing) {
			skipped.push(existing);
			continue;
		}

		created.push(
			await rolePermissionDao.create({
				system_role_cuid: role.cuid,
				permission_cuid: permission.cuid
			})
		);
	}

	return {
		created,
		skipped
	};
}

export async function removePermissionFromRoleByCuid2(system_role_cuid: string, permission_cuid: string) {
	validateCuid2(system_role_cuid, 'System role');
	validateCuid2(permission_cuid, 'Permission');

	const role = await systemRoleDao.findByCuid2(system_role_cuid);
	if (!role) {
		throw new Error('System role not found');
	}

	const permission = await permissionDao.findByCuid2(permission_cuid);
	if (!permission) {
		throw new Error('Permission not found');
	}

	const existing = await rolePermissionDao.findByRoleAndPermission(role.cuid, permission.cuid);
	if (!existing) {
		throw new Error('Role permission mapping not found');
	}

	return rolePermissionDao.removeByRoleAndPermission(role.cuid, permission.cuid);
}

export async function getPermissionKeysForRole(system_role_cuid: string): Promise<string[]> {
	return rolePermissionDao.getPermissionKeysForRole(system_role_cuid);
}
