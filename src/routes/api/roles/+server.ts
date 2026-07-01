import { requirePermission } from '$lib/server/authz/guards';
// src/routes/api/roles/+server.ts
import { json } from '@sveltejs/kit';
import * as roleService from '$lib/server/services/role.service.js';
import { sendList, sendCreated, mapRole } from '$lib/server/response.js';

/**
 * GET /api/roles
 * Returns paginated list of roles.
 * Pass ?includeInactive=true to include deactivated roles (used by role management UI).
 */
export async function GET({ url }) {
  try {
    
		requirePermission(locals.user, 'role:view');
const params = Object.fromEntries(url.searchParams.entries());
    const includeInactive = params.includeInactive === 'true';
    const result = includeInactive
      ? await roleService.listAllRoles()
      : await roleService.listRoles();
    const mapped = (result.data ?? []).map(mapRole);
    return sendList(mapped);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * POST /api/roles
 * Creates a new role.
 */
export async function POST({ request, locals }) {
	try {
		
		requirePermission(locals.user, 'role:view');
if (request.headers.get('content-type')?.includes('application/json') === false) {
			return json({ error: 'Content-Type must be application/json' }, { status: 415 });
		}
		const payload = await request.json();
		payload.created_by = locals?.user?.id;
		payload.updated_by = locals?.user?.id;
		const role = await roleService.createRole(payload);
    return sendCreated('Role', role.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
