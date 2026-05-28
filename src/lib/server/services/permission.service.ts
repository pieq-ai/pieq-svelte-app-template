import * as permissionDao from '$lib/server/dao/permission.dao.js';

export interface CreatePermissionDto {
	permission_key: string;
	status?: 'active' | 'inactive';
}

export interface UpdatePermissionDto {
	permission_key?: string;
	status?: 'active' | 'inactive';
}

function validateStatus(status: string | undefined) {
	if (status !== undefined && status !== 'active' && status !== 'inactive') {
		throw new Error('Status must be "active" or "inactive"');
	}
}

function validatePermissionKey(permissionKey: string | null | undefined) {
	if (permissionKey === undefined || permissionKey === null) {
		throw new Error('Permission key is required');
	}

	const normalized = permissionKey.trim().toLowerCase();
	if (!normalized) {
		throw new Error('Permission key is required');
	}
	if (normalized.length < 3) {
		throw new Error('Permission key must be at least 3 characters long');
	}
	if (normalized.length > 100) {
		throw new Error('Permission key cannot exceed 100 characters');
	}
	if (!/^[a-z][a-z0-9_]*$/.test(normalized)) {
		throw new Error('Permission key must use lowercase snake_case');
	}

	return normalized;
}

async function ensurePermissionKeyIsUnique(permission_key: string, currentId?: number) {
	const normalizedKey = permission_key.trim().toLowerCase();
	const permissions = await permissionDao.list();
	const duplicate = permissions.find(
		(permission) =>
			permission.permission_id !== currentId &&
			permission.permission_key.trim().toLowerCase() === normalizedKey
	);

	if (duplicate) {
		throw new Error('Permission already exists');
	}
}

export async function getPermissions() {
	return permissionDao.list();
}

export async function getPermissionById(permission_id: number) {
	if (!Number.isInteger(permission_id) || permission_id <= 0) {
		throw new Error('Permission ID must be a positive integer');
	}

	const permission = await permissionDao.findById(permission_id);
	if (!permission) {
		throw new Error(`Permission with ID "${permission_id}" not found`);
	}

	return permission;
}

export async function createPermission(dto: CreatePermissionDto) {
	const permission_key = validatePermissionKey(dto.permission_key);
	validateStatus(dto.status);
	await ensurePermissionKeyIsUnique(permission_key);

	return permissionDao.create({
		permission_key,
		status: dto.status ?? 'active'
	});
}

export async function updatePermission(permission_id: number, dto: UpdatePermissionDto) {
	const existing = await getPermissionById(permission_id);
	const updateData: permissionDao.UpdatePermissionInput = {};

	if (dto.permission_key !== undefined) {
		const permission_key = validatePermissionKey(dto.permission_key);
		await ensurePermissionKeyIsUnique(permission_key, existing.permission_id);
		updateData.permission_key = permission_key;
	}

	if (dto.status !== undefined) {
		validateStatus(dto.status);
		updateData.status = dto.status;
	}

	return permissionDao.update(permission_id, updateData);
}

export async function deletePermission(permission_id: number) {
	await getPermissionById(permission_id);
	return permissionDao.update(permission_id, {
		status: 'inactive'
	});
}
