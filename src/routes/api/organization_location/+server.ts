// src/routes/api/organization_location/+server.ts
import { json } from '@sveltejs/kit';
import * as locationService from '$lib/server/services/organization_location.service.js';

/**
 * GET /api/organization_location
 * Returns paginated list of company locations.
 * Pass ?includeInactive=true to include deactivated locations.
 */
export async function GET({ url }) {
  try {
    const params = Object.fromEntries(url.searchParams.entries());
    const includeInactive = params.includeInactive === 'true';
    const result = includeInactive
      ? await locationService.listAllLocations(params)
      : await locationService.listLocations(params);
    return json(result);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * POST /api/organization_location
 * Creates a new company location.
 */
export async function POST({ request }) {
  try {
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

    const location = await locationService.createLocation(payload);
    return json({ data: location }, { status: 201 });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
