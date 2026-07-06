import type { RequestEvent } from '@sveltejs/kit';
// src/routes/api/organization_location/[cuid]/+server.ts
import { json } from '@sveltejs/kit';
import * as locationService from '$lib/server/services/organization_location.service.js';
import { sendUpdated, sendDeleted } from '$lib/server/response.js';

/**
 * Helper to parse and validate CUID from URL params.
 */
function parseCuid(param: string | undefined): string {
  if (!param) {
    const err: any = new Error('Missing location CUID');
    err.status = 400;
    throw err;
  }
  if (!/^[a-z0-9]{20,36}$/i.test(param)) {
    const err: any = new Error('Invalid location CUID format');
    err.status = 400;
    throw err;
  }
  return param;
}

/**
 * PUT /api/organization_location/:cuid
 * Updates an existing company location (partial update allowed).
 */
export async function PUT({ request, params, locals }: RequestEvent) {
  try {
    const cuid = parseCuid(params.cuid);
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Malformed or invalid JSON' }, { status: 400 });
    }

    payload.updated_by = locals?.user?.id;
    const location = await locationService.updateLocation(cuid, payload);
    return sendUpdated('Company Location', location.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * PATCH /api/organization_location/:cuid
 * Activates a deactivated location.
 */
export async function PATCH({ params, locals }: RequestEvent) {
  try {
    const cuid = parseCuid(params.cuid);
    const location = await locationService.activateLocation(cuid, locals?.user?.id);
    return sendUpdated('Company Location', location.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * DELETE /api/organization_location/:cuid
 * Soft‑deletes (deactivates) a company location.
 */
export async function DELETE({ params, locals }: RequestEvent) {
  try {
    const cuid = parseCuid(params.cuid);
    const location = await locationService.deleteLocation(cuid, locals?.user?.id);
    return sendDeleted('Company Location', location.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
