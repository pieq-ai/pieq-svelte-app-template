// src/lib/server/services/role.service.ts
import type { RoleCreateDTO, RoleUpdateDTO } from '$lib/types/role';
import * as roleDao from '$lib/server/dao/role.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/role.validator.js';

/** List only active roles with pagination. */
export async function listRoles(query: Record<string, any>) {
  const { page, limit } = validatePaginationParams(query);
  const total = await roleDao.countRoles();
  const data = await roleDao.getRoles(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** List ALL roles (active + inactive) with pagination — used by UI role management. */
export async function listAllRoles(query: Record<string, any>) {
  const { page, limit } = validatePaginationParams(query);
  const total = await roleDao.countAllRoles();
  const data = await roleDao.getAllRoles(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** Create a new role after validation and duplicate check. */
export async function createRole(payload: any) {
  const valid = validateCreatePayload(payload);
  // Ensure unique active name
  const existing = await roleDao.getRoles(1, 1000);
  if (existing.some((r) => r.name.toLowerCase() === valid.name.toLowerCase() && r.status)) {
    const err: any = new Error('Role name already exists');
    err.status = 409;
    throw err;
  }
  return roleDao.createRole({ name: valid.name });
}

/** Update existing role. */
export async function updateRole(id: number, payload: any) {
  const valid = validateUpdatePayload(payload);
  const role = await roleDao.getRoleById(id);
  if (!role) {
    const err: any = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  // Duplicate name check if name provided
  if (valid.name) {
    const existing = await roleDao.getRoles(1, 1000);
    if (existing.some((r) => r.name.toLowerCase() === valid.name.toLowerCase() && r.status && r.role_id !== id)) {
      const err: any = new Error('Role name already exists');
      err.status = 409;
      throw err;
    }
  }
  return roleDao.updateRole(id, { name: valid.name });
}

/** Soft delete a role. */
export async function deleteRole(id: number) {
  const role = await roleDao.getRoleById(id);
  if (!role) {
    const err: any = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  return roleDao.deactivateRole(id);
}
