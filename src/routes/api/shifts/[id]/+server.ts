// src/routes/api/shifts/[id]/+server.ts
import { json } from '@sveltejs/kit';
import * as shiftService from '$lib/server/services/shift.service.js';

/**
 * Helper to parse and validate numeric ID from the URL params.
 * Rejects non-numeric, decimal, zero, or negative IDs with a 400 status.
 */
function parseId(param: string | undefined): number {
  if (!param) {
    const err: any = new Error('Missing shift ID');
    err.status = 400;
    throw err;
  }
  const id = Number(param);
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
    const err: any = new Error('Invalid shift ID');
    err.status = 400;
    throw err;
  }
  return id;
}

/**
 * PUT /api/shifts/:id
 * Updates an existing shift (partial update allowed).
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

    const shift = await shiftService.updateShift(id, payload);
    return json({ data: shift });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * PATCH /api/shifts/:id
 * Activates a deactivated shift.
 */
export async function PATCH({ params }) {
  try {
    const id = parseId(params.id);
    const shift = await shiftService.activateShift(id);
    return json({ data: shift });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * DELETE /api/shifts/:id
 * Soft‑deletes (deactivates) a shift.
 */
export async function DELETE({ params }) {
  try {
    const id = parseId(params.id);
    const shift = await shiftService.deleteShift(id);
    return json({ message: 'Shift deactivated successfully', data: shift });
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
