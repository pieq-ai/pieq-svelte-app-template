// src/routes/api/roles/[id]/+server.ts
import { json } from '@sveltejs/kit';
import * as roleService from '$lib/server/services/role.service.js';

/**
 * Helper to parse and validate numeric ID from the URL params.
 */
function parseId(param: string | undefined): number {
  if (!param) {
    const err: any = new Error('Missing role ID');
    err.status = 400;
    throw err;
  }
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) {
    const err: any = new Error('Invalid role ID');
    err.status = 400;
    throw err;
  }
  return id;
}

/**
 * PUT /api/roles/:id
 * Updates an existing role (partial update allowed).
 */
export async function PUT({ request, params }) {
  try {
    const id = parseId(params.id);
    if (request.headers.get('content-type')?.includes('application/json') === false) {
      return json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }
    const payload = await request.json();
    const role = await roleService.updateRole(id, payload);
    return json({ data: role });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * DELETE /api/roles/:id
 * Soft‑deletes (deactivates) a role.
 */
export async function DELETE({ params }) {
  try {
    const id = parseId(params.id);
    console.log('DELETE handler start for id:', id);
    const result = await roleService.deleteRole(id);
    console.log('DELETE handler finished, result:', result);
    return json({ message: 'Role deactivated successfully', result }, { status: 200 });
  } catch (err: any) {
    console.error('DELETE handler error:', err);
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
