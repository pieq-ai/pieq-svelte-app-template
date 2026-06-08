import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';
import { ValidationError } from '$lib/server/utils/errors.js';

export interface CreateSystemRoleDto {
	system_role_name: string;
	status?: boolean;
	created_by?: string;
	created_at?: Date | string | null;
	updated_at?: Date | string | null;
}

export interface UpdateSystemRoleDto {
	system_role_name?: string;
	status?: boolean;
	updated_by?: string;
	updated_at?: Date | string | null;
}

function toPublicSystemRole(role: {
	cuid: string;
	system_role_name: string;
	status: boolean;
 created_at: Date; created_by: string | null; updated_at: Date; updated_by: string | null; }) {
	return {
		cuid: role.cuid,
		system_role_name: role.system_role_name,
		status: role.status
	,
		created_at: role.created_at,
		created_by: role.created_by,
		updated_at: role.updated_at,
		updated_by: role.updated_by
	};
}

function validateStatus(status: boolean | undefined) {
	if (status !== undefined && status !== true && status !== false) {
		throw new Error('Status must be a boolean');
	}
}

function validateRoleName(name: string | null | undefined) {
	if (name === undefined || name === null) {
		throw new Error('Role name is required');
	}

	const trimmed = name.trim().replace(/\s+/g, ' ');
	if (!trimmed) {
		throw new Error('Role name is required');
	}
	if (trimmed.length < 2) {
		throw new Error('Role name must be at least 2 characters long');
	}
	if (trimmed.length > 100) {
		throw new Error('Role name cannot exceed 100 characters');
	}
	if (!/^[A-Za-z ]+$/.test(trimmed)) {
		throw new Error('Role name must contain only letters and spaces');
	}

	return trimmed;
}

async function ensureRoleNameIsUnique(system_role_name: string, currentId?: number) {
	const normalizedName = system_role_name.trim().toLowerCase();
	const roles = await systemRoleDao.list();
	const duplicate = roles.find(
		(role) =>
			role.id !== currentId &&
			role.system_role_name.trim().toLowerCase() === normalizedName
	);

	if (duplicate) {
		throw new ValidationError('system_role_name', 'System role already exists');
	}
}

export async function getSystemRoles() {
	return (await systemRoleDao.list()).map(toPublicSystemRole);
}

export async function getSystemRoleById(id: number) {
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error('System role ID must be a positive integer');
	}

	const role = await systemRoleDao.findById(id);
	if (!role) {
		throw new Error(`System role with ID "${id}" not found`);
	}

	return toPublicSystemRole(role);
}

export async function getSystemRoleByCuid2(cuid: string) {
	if (!cuid) {
		throw new Error('System role CUID2 is required');
	}

	const role = await systemRoleDao.findByCuid2(cuid);
	if (!role) {
		throw new Error(`System role with CUID2 "${cuid}" not found`);
	}

	return toPublicSystemRole(role);
}

export async function createSystemRole(dto: CreateSystemRoleDto) {
	const system_role_name = validateRoleName(dto.system_role_name);
	validateStatus(dto.status);
	await ensureRoleNameIsUnique(system_role_name);

	return toPublicSystemRole(await systemRoleDao.create({
		system_role_name,
		status: dto.status ?? true,
		created_by: dto.created_by ?? undefined,
		created_at: dto.created_at ?? undefined,
		updated_at: dto.updated_at ?? undefined
	}));
}

export async function updateSystemRole(cuid: string, dto: UpdateSystemRoleDto) {
	const existing = await systemRoleDao.findByCuid2(cuid);
	if (!existing) {
		throw new Error(`System role with CUID2 "${cuid}" not found`);
	}
	const updateData: systemRoleDao.UpdateSystemRoleInput = {};

	if (dto.updated_at !== undefined) {
		updateData.updated_at = dto.updated_at ?? undefined;
	}

	if (dto.updated_by !== undefined) {
		updateData.updated_by = dto.updated_by;
	}

	if (dto.system_role_name !== undefined) {
		const system_role_name = validateRoleName(dto.system_role_name);
		await ensureRoleNameIsUnique(system_role_name, existing.id);
		updateData.system_role_name = system_role_name;
	}

	if (dto.status !== undefined) {
		validateStatus(dto.status);
		updateData.status = dto.status;
	}

	return toPublicSystemRole(await systemRoleDao.update(existing.id, updateData));
}

export async function deleteSystemRole(cuid: string, deletedBy?: string) {
	const existing = await systemRoleDao.findByCuid2(cuid);
	if (!existing) {
		throw new Error(`System role with CUID2 "${cuid}" not found`);
	}
	return toPublicSystemRole(await systemRoleDao.update(existing.id, {
		status: false,
		updated_by: deletedBy
	}));
}
