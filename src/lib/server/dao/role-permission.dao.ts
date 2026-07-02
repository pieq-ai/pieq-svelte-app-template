import { db } from '$lib/server/db.js';

export interface CreateRolePermissionInput {
	system_role_cuid: string;
	permission_cuid: string;
	created_by?: string;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export async function list() {
	return db.rolePermission.findMany({
		orderBy: {
			id: 'asc'
		}
	});
}

export async function findById(id: bigint) {
	return db.rolePermission.findUnique({
		where: {
			id
		}
	});
}

export async function findByRoleAndPermission(system_role_cuid: string, permission_cuid: string) {
	return db.rolePermission.findUnique({
		where: {
			system_role_cuid_permission_cuid: {
				system_role_cuid,
				permission_cuid }
		}
	});
}

export async function create(data: CreateRolePermissionInput) {
	return db.rolePermission.create({
		data
	});
}

export async function remove(id: bigint) {
	return db.rolePermission.delete({
		where: {
			id
		}
	});
}

export async function removeByRoleAndPermission(system_role_cuid: string, permission_cuid: string) {
	return db.rolePermission.delete({
		where: {
			system_role_cuid_permission_cuid: {
				system_role_cuid,
				permission_cuid }
		}
	});
}

export async function getPermissionKeysForRole(system_role_cuid: string): Promise<string[]> {
    if (!system_role_cuid) return [];
    const rows = await db.$queryRaw`
        SELECT p.permission_key
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_cuid = p.cuid
        WHERE rp.system_role_cuid = ${system_role_cuid} AND p.status = true;
    `;
    return (rows as any[]).map(r => r.permission_key);
}
