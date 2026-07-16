import * as permissionDao from '$lib/server/dao/permission.dao.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export interface CreatePermissionDto {
	permission_key: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string | null;
	updated_at?: Date | string | null;
}

export interface UpdatePermissionDto {
	permission_key?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string | null;
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
	if (!/^[a-z][a-z0-9_:]*$/.test(normalized)) {
		throw new Error('Permission key must use lowercase snake_case and can contain colons');
	}

	return normalized;
}

async function ensurePermissionKeyIsUnique(permission_key: string, currentId?: bigint) {
	const normalizedKey = permission_key.trim().toLowerCase();
	const permissions = await permissionDao.list();
	const duplicate = permissions.find(
		(permission) =>
			permission.id !== currentId &&
			permission.permission_key.trim().toLowerCase() === normalizedKey
	);

	if (duplicate) {
		throw new ValidationError('permission_key', 'Permission already exists');
	}
}

export async function getPermissions() {
	return (await permissionDao.list()).map(toPublicPermission);
}

export async function getPermissionById(id: bigint) {
	if (typeof id !== 'bigint' || id <= 0n) {
		throw new Error('Permission ID must be a positive integer');
	}

	const permission = await permissionDao.findById(id);
	if (!permission) {
		throw new Error(`Permission with ID "${id}" not found`);
	}

	return toPublicPermission(permission);
}

export async function getPermissionByCuid2(cuid: string) {
	if (!cuid) {
		throw new Error('Permission CUID2 is required');
	}

	const permission = await permissionDao.findByCuid2(cuid);
	if (!permission) {
		throw new Error(`Permission with CUID2 "${cuid}" not found`);
	}

	return toPublicPermission(permission);
}

export async function createPermission(dto: CreatePermissionDto) {
	const permission_key = validatePermissionKey(dto.permission_key);
	validateStatus(dto.status);
	await ensurePermissionKeyIsUnique(permission_key);

	return toPublicPermission(await permissionDao.create({
		permission_key,
		status: dto.status ?? true,
		created_by: dto.created_by ?? undefined,
		created_at: dto.created_at ?? undefined,
		updated_at: dto.updated_at ?? undefined
	}));
}

export async function updatePermission(cuid: string, dto: UpdatePermissionDto) {
	const existing = await permissionDao.findByCuid2(cuid);
	if (!existing) {
		throw new Error(`Permission with CUID2 "${cuid}" not found`);
	}
	const updateData: permissionDao.UpdatePermissionInput = {};

	if (dto.updated_at !== undefined) {
		updateData.updated_at = dto.updated_at ?? undefined;
	}

	if (dto.updated_by !== undefined) {
		updateData.updated_by = dto.updated_by;
	}

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

export async function deletePermission(cuid: string, deletedBy?: string) {
	const existing = await permissionDao.findByCuid2(cuid);
	if (!existing) {
		throw new Error(`Permission with CUID2 "${cuid}" not found`);
	}
	return toPublicPermission(await permissionDao.update(existing.id, {
		status: false,
		updated_by: deletedBy
	}));
}
