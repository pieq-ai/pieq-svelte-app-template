// src/lib/server/dao/role.dao.ts
import { db } from '$lib/server/db.js';
import type { Role, RoleCreateDTO, RoleUpdateDTO } from '$lib/types/role';

/**
 * Create a new role.
 */
export async function createRole(data: RoleCreateDTO): Promise<Role> {
  return db.role.create({
    data: {
      name: data.name.trim()
    },
  });
}

/**
 * Get a paginated list of active roles.
 */
export async function getRoles(page: number, limit: number): Promise<Role[]> {
  const skip = (page - 1) * limit;
  return db.role.findMany({
    where: { is_active: true },
    orderBy: { role_id: 'asc' },
    skip,
    take: limit,
  });
}

/**
 * Get a paginated list of ALL roles (active + inactive).
 * Used by the UI to display soft-deleted roles.
 */
export async function getAllRoles(page: number, limit: number): Promise<Role[]> {
  const skip = (page - 1) * limit;
  return db.role.findMany({
    orderBy: { role_id: 'asc' },
    skip,
    take: limit,
  });
}

/**
 * Count ALL roles including inactive.
 */
export async function countAllRoles(): Promise<number> {
  return db.role.count();
}

/**
 * Count active roles (used for pagination metadata).
 */
export async function countRoles(): Promise<number> {
  return db.role.count({ where: { is_active: true } });
}

/**
 * Retrieve a role by its numeric ID (including inactive for update/delete checks).
 */
export async function getRoleById(roleId: number): Promise<Role | null> {
  return db.role.findUnique({ where: { role_id: roleId } });
}

/**
 * Update an existing role.
 */
export async function updateRole(roleId: number, data: RoleUpdateDTO): Promise<Role> {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  // updated_at handled automatically by Prisma @updatedAt
  return db.role.update({
    where: { role_id: roleId },
    data: updateData,
  });
}

/**
 * Soft‑delete (deactivate) a role.
 */
export async function deactivateRole(roleId: number, deletedBy?: number): Promise<Role> {
  return db.role.update({
    where: { role_id: roleId },
    data: { is_active: false }
  });
}
