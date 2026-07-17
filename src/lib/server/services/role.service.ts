import type { RoleCreateDTO, RoleUpdateDTO, Role } from '$lib/types/role';
import * as roleDao from '$lib/server/dao/role.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/role.validator.js';
import * as auditService from '$lib/server/services/audit.service.js';

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
  const nameToCheck = valid.name.trim().toLowerCase();
  
  // Ensure unique name across active and inactive roles
  const existing = await roleDao.getAllRoles();
  if (existing.some((r) => r.name.trim().toLowerCase() === nameToCheck)) {
    const err: any = new Error('Role name already exists');
    err.status = 409;
    throw err;
  }
  const created = await roleDao.createRole(valid);

  await auditService.log({
    entity_name: 'Role',
    entity_cuid: created.cuid,
    action_type: 'create',
    status: 'SUCCESS',
    remarks: `Role "${created.name}" created.`
  });

  return created;
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
    const nameToCheck = valid.name.trim().toLowerCase();
    const existing = await roleDao.getAllRoles();
    if (existing.some((r) => r.name.trim().toLowerCase() === nameToCheck && r.cuid !== cuid)) {
      const err: any = new Error('Role name already exists');
      err.status = 409;
      throw err;
    }
  }
  const updated = await roleDao.updateRole(cuid, valid);

  await auditService.logUpdate({
    entityName: 'Role',
    entityCuid: cuid,
    oldRecord: role,
    newRecord: updated
  });

  return updated;
}

/** Soft delete a role. */
export async function deleteRole(cuid: string, updatedBy?: string): Promise<Role> {
  const role = await roleDao.getRoleByCuid(cuid);
  if (!role) {
    const err: any = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  const deactivated = await roleDao.deactivateRole(cuid, updatedBy);

  await auditService.log({
    entity_name: 'Role',
    entity_cuid: cuid,
    action_type: 'delete',
    status: 'SUCCESS',
    remarks: `Role "${role.name}" soft-deleted (deactivated).`
  });

  return deactivated;
}
