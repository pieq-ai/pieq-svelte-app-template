import * as permissionDao from '$lib/server/dao/permission.dao.js';

export interface CreatePermissionDto {
	permission_key: string;
	status?: boolean;
}

export interface UpdatePermissionDto {
	permission_key?: string;
	status?: boolean;
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

function validateStatus(status: boolean | undefined) {
	if (status !== undefined && status !== true && status !== false) {
		throw new Error('Status must be a boolean');
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
			permission.id !== currentId &&
			permission.permission_key.trim().toLowerCase() === normalizedKey
	);

	if (duplicate) {
		throw new Error('Permission already exists');
	}
}

export async function getPermissions() {
	return (await permissionDao.list()).map(toPublicPermission);
}

export async function getPermissionById(id: number) {
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error('Permission ID must be a positive integer');
	}

	const permission = await permissionDao.findById(id);
	if (!permission) {
		throw new Error(`Permission with ID "${id}" not found`);
	}

	return toPublicPermission(permission);
}

export async function getPermissionByCuid2(cuid2: string) {
	if (!cuid2) {
		throw new Error('Permission CUID2 is required');
	}

	const permission = await permissionDao.findByCuid2(cuid2);
	if (!permission) {
		throw new Error(`Permission with CUID2 "${cuid2}" not found`);
	}

	return toPublicPermission(permission);
}

export async function createPermission(dto: CreatePermissionDto) {
	const permission_key = validatePermissionKey(dto.permission_key);
	validateStatus(dto.status);
	await ensurePermissionKeyIsUnique(permission_key);

	return toPublicPermission(await permissionDao.create({
		permission_key,
		status: dto.status ?? true
	}));
}

export async function updatePermission(cuid2: string, dto: UpdatePermissionDto) {
	const existing = await permissionDao.findByCuid2(cuid2);
	if (!existing) {
		throw new Error(`Permission with CUID2 "${cuid2}" not found`);
	}
	const updateData: permissionDao.UpdatePermissionInput = {};

	if (dto.permission_key !== undefined) {
		const permission_key = validatePermissionKey(dto.permission_key);
		await ensurePermissionKeyIsUnique(permission_key, existing.id);
		updateData.permission_key = permission_key;
	}

	if (dto.status !== undefined) {
		validateStatus(dto.status);
		updateData.status = dto.status;
	}

	return toPublicPermission(await permissionDao.update(existing.id, updateData));
}

export async function deletePermission(cuid2: string) {
	const existing = await permissionDao.findByCuid2(cuid2);
	if (!existing) {
		throw new Error(`Permission with CUID2 "${cuid2}" not found`);
	}
	return toPublicPermission(await permissionDao.update(existing.id, {
		status: false
	}));
}
