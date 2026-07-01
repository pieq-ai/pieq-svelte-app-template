import { requirePermission } from '$lib/server/authz/guards';
// src/routes/api/organization_location/+server.ts
import { json } from '@sveltejs/kit';
import * as locationService from '$lib/server/services/organization_location.service.js';
import { sendList, sendCreated, mapLocation } from '$lib/server/response.js';

/**
 * GET /api/organization_location
 * Returns paginated list of company locations.
 * Pass ?includeInactive=true to include deactivated locations.
 */
export async function GET({ url }) {
  try {
    
		requirePermission(locals.user, 'location:view');
const params = Object.fromEntries(url.searchParams.entries());
    const includeInactive = params.includeInactive === 'true';
    const result = includeInactive
      ? await locationService.listAllLocations()
      : await locationService.listLocations();
    const mapped = (result.data ?? []).map(mapLocation);
    return sendList(mapped);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * POST /api/organization_location
 * Creates a new company location.
 */
export async function POST({ request, locals }) {
  try {
    
		requirePermission(locals.user, 'location:view');
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

    payload.created_by = locals?.user?.id;
    payload.updated_by = locals?.user?.id;
    const location = await locationService.createLocation(payload);
    return sendCreated('Company Location', location.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
