// src/routes/api/organization_location/[id]/+server.ts
import { json } from '@sveltejs/kit';
import * as locationService from '$lib/server/services/organization_location.service.js';

/**
 * Helper to parse and validate numeric ID from URL params.
 * Rejects non-numeric, decimal, zero, negative, or SQL Injection IDs with a 400 status.
 */
function parseId(param: string | undefined): number {
  if (!param) {
    const err: any = new Error('Missing location ID');
    err.status = 400;
    throw err;
  }

  // Security guard against SQL injection payloads inside route parameters
  if (param.includes("'") || param.includes('"') || param.includes('--') || param.includes('/*')) {
    const err: any = new Error('Invalid location ID format');
    err.status = 400;
    throw err;
  }

  const id = Number(param);
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
    const err: any = new Error('Invalid location ID');
    err.status = 400;
    throw err;
  }
  return id;
}

/**
 * PUT /api/organization_location/:id
 * Updates an existing company location (partial update allowed).
 */
export async function PUT({ request, params }) {
  try {
    const id = parseId(params.id);
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

    const location = await locationService.updateLocation(id, payload);
    return json({ data: location });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * PATCH /api/organization_location/:id
 * Activates a deactivated location.
 */
export async function PATCH({ params }) {
  try {
    const id = parseId(params.id);
    const location = await locationService.activateLocation(id);
    return json({ data: location });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * DELETE /api/organization_location/:id
 * Soft‑deletes (deactivates) a company location.
 */
export async function DELETE({ params }) {
  try {
    const id = parseId(params.id);
    const location = await locationService.deleteLocation(id);
    return json({ message: 'Company Location deactivated successfully', data: location });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
