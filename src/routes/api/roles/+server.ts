// src/routes/api/roles/+server.ts
import { json } from '@sveltejs/kit';
import * as roleService from '$lib/server/services/role.service.js';

/**
 * GET /api/roles
 * Returns paginated list of active roles.
 */
export async function GET({ url }) {
  try {
    const result = await roleService.listRoles(Object.fromEntries(url.searchParams.entries()));
    return json(result);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * POST /api/roles
 * Creates a new role.
 */
export async function POST({ request }) {
  try {
    if (request.headers.get('content-type')?.includes('application/json') === false) {
      return json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }
    const payload = await request.json();
    const role = await roleService.createRole(payload);
    return json({ data: role }, { status: 201 });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
