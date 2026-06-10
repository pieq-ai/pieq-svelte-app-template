// src/routes/api/shifts/[cuid]/+server.ts
import { json } from '@sveltejs/kit';
import * as shiftService from '$lib/server/services/shift.service.js';
import { sendUpdated, sendDeleted } from '$lib/server/response.js';

/**
 * Helper to parse and validate CUID from the URL params.
 */
function parseCuid(param: string | undefined): string {
  if (!param) {
    const err: any = new Error('Missing shift CUID');
    err.status = 400;
    throw err;
  }
  if (!/^[a-z0-9]{20,36}$/i.test(param)) {
    const err: any = new Error('Invalid shift CUID format');
    err.status = 400;
    throw err;
  }
  return param;
}

/**
 * PUT /api/shifts/:cuid
 * Updates an existing shift (partial update allowed).
 */
export async function PUT({ request, params }) {
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

    const shift = await shiftService.updateShift(cuid, payload);
    return sendUpdated('Shift', shift.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * PATCH /api/shifts/:cuid
 * Activates a deactivated shift.
 */
export async function PATCH({ params }) {
  try {
    const cuid = parseCuid(params.cuid);
    const shift = await shiftService.activateShift(cuid);
    return sendUpdated('Shift', shift.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * DELETE /api/shifts/:cuid
 * Soft‑deletes (deactivates) a shift.
 */
export async function DELETE({ params }) {
  try {
    const cuid = parseCuid(params.cuid);
    const shift = await shiftService.deleteShift(cuid);
    return sendDeleted('Shift', shift.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
