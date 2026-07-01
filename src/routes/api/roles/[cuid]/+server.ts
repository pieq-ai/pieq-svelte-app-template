import { requirePermission } from '$lib/server/authz/guards';
// src/routes/api/roles/[cuid]/+server.ts
import { json } from '@sveltejs/kit';
import * as roleService from '$lib/server/services/role.service.js';
import { sendUpdated, sendDeleted } from '$lib/server/response.js';

/**
 * Helper to parse and validate CUID from the URL params.
 */
function parseCuid(param: string | undefined): string {
  if (!param) {
    const err: any = new Error('Missing role CUID');
    err.status = 400;
    throw err;
  }
  if (!/^[a-z0-9]{20,36}$/i.test(param)) {
    const err: any = new Error('Invalid role CUID format');
    err.status = 400;
    throw err;
  }
  return param;
}

/**
 * PUT /api/roles/:cuid
 * Updates an existing role (partial update allowed).
 */
export async function PUT({ request, params, locals }) {
  try {
    
		requirePermission(locals.user, 'role:view');
const cuid = parseCuid(params.cuid);
    if (request.headers.get('content-type')?.includes('application/json') === false) {
      return json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }
    const payload = await request.json();
    payload.updated_by = locals?.user?.id;
    const role = await roleService.updateRole(cuid, payload);
    return sendUpdated('Role', role.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * DELETE /api/roles/:cuid
 * Soft‑deletes (deactivates) a role.
 */
export async function DELETE({ params, locals }) {
  try {
    
		requirePermission(locals.user, 'role:view');
const cuid = parseCuid(params.cuid);
    const result = await roleService.deleteRole(cuid, locals?.user?.id);
    return sendDeleted('Role', result.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
