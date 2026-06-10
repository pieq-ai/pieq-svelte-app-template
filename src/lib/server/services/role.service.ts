// src/lib/server/services/role.service.ts
import type { RoleCreateDTO, RoleUpdateDTO, Role } from '$lib/types/role';
import * as roleDao from '$lib/server/dao/role.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/role.validator.js';

/** List only active roles. */
export async function listRoles(query?: Record<string, unknown>): Promise<{ data: Role[] }> {
  const data = await roleDao.getRoles();
  return { data };
}

/** List ALL roles (active + inactive) — used by UI role management. */
export async function listAllRoles(query?: Record<string, unknown>): Promise<{ data: Role[] }> {
  const data = await roleDao.getAllRoles();
  return { data };
}

/** Create a new role after validation and duplicate check. */
export async function createRole(payload: unknown): Promise<Role> {
  const valid = validateCreatePayload(payload);
  // Ensure unique active name
  const existing = await roleDao.getRoles();
  if (existing.some((r) => r.role_name.toLowerCase() === valid.role_name.toLowerCase() && r.status)) {
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
  if (valid.role_name) {
    const nameToCheck = valid.role_name.toLowerCase();
    const existing = await roleDao.getRoles();
    if (existing.some((r) => r.role_name.toLowerCase() === nameToCheck && r.status && r.cuid !== cuid)) {
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
