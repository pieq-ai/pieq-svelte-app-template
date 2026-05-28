import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';

export interface CreateSystemRoleDto {
	system_role_name: string;
	status?: 'active' | 'inactive';
}

export interface UpdateSystemRoleDto {
	system_role_name?: string;
	status?: 'active' | 'inactive';
}

function validateStatus(status: string | undefined) {
	if (status !== undefined && status !== 'active' && status !== 'inactive') {
		throw new Error('Status must be "active" or "inactive"');
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
	if (!/^[A-Za-z0-9 ]+$/.test(trimmed)) {
		throw new Error('Role name must contain only letters, numbers, and spaces');
	}

	return trimmed;
}

async function ensureRoleNameIsUnique(system_role_name: string, currentId?: number) {
	const normalizedName = system_role_name.trim().toLowerCase();
	const roles = await systemRoleDao.list();
	const duplicate = roles.find(
		(role) =>
			role.system_role_id !== currentId &&
			role.system_role_name.trim().toLowerCase() === normalizedName
	);

	if (duplicate) {
		throw new Error('System role already exists');
	}
}

export async function getSystemRoles() {
	return systemRoleDao.list();
}

export async function getSystemRoleById(system_role_id: number) {
	if (!Number.isInteger(system_role_id) || system_role_id <= 0) {
		throw new Error('System role ID must be a positive integer');
	}

	const role = await systemRoleDao.findById(system_role_id);
	if (!role) {
		throw new Error(`System role with ID "${system_role_id}" not found`);
	}

	return role;
}

export async function createSystemRole(dto: CreateSystemRoleDto) {
	const system_role_name = validateRoleName(dto.system_role_name);
	validateStatus(dto.status);
	await ensureRoleNameIsUnique(system_role_name);

	return systemRoleDao.create({
		system_role_name,
		status: dto.status ?? 'active'
	});
}

export async function updateSystemRole(system_role_id: number, dto: UpdateSystemRoleDto) {
	const existing = await getSystemRoleById(system_role_id);
	const updateData: systemRoleDao.UpdateSystemRoleInput = {};

	if (dto.system_role_name !== undefined) {
		const system_role_name = validateRoleName(dto.system_role_name);
		await ensureRoleNameIsUnique(system_role_name, existing.system_role_id);
		updateData.system_role_name = system_role_name;
	}

	if (dto.status !== undefined) {
		validateStatus(dto.status);
		updateData.status = dto.status;
	}

	return systemRoleDao.update(system_role_id, updateData);
}

export async function deleteSystemRole(system_role_id: number) {
	await getSystemRoleById(system_role_id);
	return systemRoleDao.update(system_role_id, {
		status: 'inactive'
	});
}
