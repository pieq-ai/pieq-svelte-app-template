// src/lib/server/services/role.service.ts
import type { RoleCreateDTO, RoleUpdateDTO, Role } from '$lib/types/role';
import * as roleDao from '$lib/server/dao/role.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/role.validator.js';

/** List only active roles with pagination. */
export async function listRoles(query: Record<string, unknown>): Promise<{ data: Role[]; pagination: { page: number; limit: number; total: number } }> {
  const { page, limit } = validatePaginationParams(query);
  const total = await roleDao.countRoles();
  const data = await roleDao.getRoles(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** List ALL roles (active + inactive) with pagination — used by UI role management. */
export async function listAllRoles(query: Record<string, unknown>): Promise<{ data: Role[]; pagination: { page: number; limit: number; total: number } }> {
  const { page, limit } = validatePaginationParams(query);
  const total = await roleDao.countAllRoles();
  const data = await roleDao.getAllRoles(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** Create a new role after validation and duplicate check. */
export async function createRole(payload: unknown): Promise<Role> {
  const valid = validateCreatePayload(payload);
  // Ensure unique active name
  const existing = await roleDao.getRoles(1, 1000);
  if (existing.some((r) => r.name.toLowerCase() === valid.name.toLowerCase() && r.status)) {
    const err: any = new Error('Role name already exists');
    err.status = 409;
    throw err;
  }
  return roleDao.createRole(valid);
}

/** Update existing role. */
export async function updateRole(cuid: string, payload: unknown): Promise<Role> {
  const valid = validateUpdatePayload(payload);
  const role = await roleDao.getRoleByCuid(cuid);
  if (!role) {
    const err: any = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  // Duplicate name check if name provided
  if (valid.name) {
    const existing = await roleDao.getRoles(1, 1000);
    if (existing.some((r) => r.name.toLowerCase() === valid.name.toLowerCase() && r.status && r.cuid !== cuid)) {
      const err: any = new Error('Role name already exists');
      err.status = 409;
      throw err;
    }
  }
  return roleDao.updateRole(cuid, valid);
}

/** Soft delete a role. */
export async function deleteRole(cuid: string): Promise<Role> {
  const role = await roleDao.getRoleByCuid(cuid);
  if (!role) {
    const err: any = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  return roleDao.deactivateRole(cuid);
}
