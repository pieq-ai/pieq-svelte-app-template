// src/lib/server/dao/role.dao.ts
import { db } from '$lib/server/db.js';
import type { Role, RoleCreateDTO, RoleUpdateDTO } from '$lib/types/role';

/**
 * Create a new role.
 */
export async function createRole(data: RoleCreateDTO): Promise<Role> {
  return db.role.create({
    data: {
      role_name: data.role_name.trim(),
      status: data.status ?? true,
      created_by: data.created_by ?? null,
      updated_by: data.updated_by ?? null
    },
    select: {
      cuid: true,
      role_name: true,
      status: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true
    }
  });
}

/**
 * Get a list of active roles.
 */
export async function getRoles(): Promise<Role[]> {
  return db.role.findMany({
    where: { status: true },
    orderBy: { updated_at: 'desc' },
    select: {
      cuid: true,
      role_name: true,
      status: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true
    }
  });
}

/**
 * Get a list of ALL roles (active + inactive).
 * Used by the UI to display soft-deleted roles.
 */
export async function getAllRoles(): Promise<Role[]> {
  return db.role.findMany({
    orderBy: { updated_at: 'desc' },
    select: {
      cuid: true,
      role_name: true,
      status: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true
    }
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
  return db.role.count({ where: { status: true } });
}

/**
 * Retrieve a role by its CUID.
 */
export async function getRoleByCuid(cuid: string): Promise<Role | null> {
  return db.role.findUnique({
    where: { cuid },
    select: {
      cuid: true,
      role_name: true,
      status: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true
    }
  });
}

/**
 * Update an existing role.
 */
export async function updateRole(cuid: string, data: RoleUpdateDTO): Promise<Role> {
  const updateData: any = {};
  if (data.role_name !== undefined) updateData.role_name = data.role_name.trim();
  if (data.status !== undefined) updateData.status = data.status;
  if (data.updated_by !== undefined) updateData.updated_by = data.updated_by;

  return db.role.update({
    where: { cuid },
    data: updateData,
    select: {
      cuid: true,
      role_name: true,
      status: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true
    }
  });
}

/**
 * Soft‑delete (deactivate) a role.
 */
export async function deactivateRole(cuid: string): Promise<Role> {
  return db.role.update({
    where: { cuid },
    data: { status: false },
    select: {
      cuid: true,
      role_name: true,
      status: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true
    }
  });
}
