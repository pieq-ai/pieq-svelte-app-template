// src/routes/api/shift-assignments/[cuid]/+server.ts
import { json } from '@sveltejs/kit';
import * as shiftAssignmentService from '$lib/server/services/shift-assignment.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { successResponse, updateSuccessResponse, deleteSuccessResponse } from '$lib/server/response.js';
import { _mapShiftAssignment } from '../+server.js';

function parseCuid(param: string | undefined): string {
  if (!param) {
    const err: any = new Error('Missing shift assignment CUID');
    err.status = 400;
    throw err;
  }
  if (!/^[a-z0-9]{20,36}$/i.test(param)) {
    const err: any = new Error('Invalid shift assignment CUID format');
    err.status = 400;
    throw err;
  }
  return param;
}

/**
 * GET /api/shift-assignments/:cuid
 * Gets details of a shift assignment.
 */
export async function GET({ params, locals }) {
  try {
    permissionGuard.requireAuth(locals.user);
    const email = locals.user?.email || '';
    const cuid = parseCuid(params.cuid);

    const assignment = await shiftAssignmentService.getAssignmentDetails(cuid, email);
    const formatted = _mapShiftAssignment(assignment);

    return successResponse(formatted);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * PUT /api/shift-assignments/:cuid
 * Updates an existing shift assignment.
 */
export async function PUT({ request, params, locals }) {
  try {
    permissionGuard.requireAuth(locals.user);
    const email = locals.user?.email || '';
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

    const session = await locals.auth();
    const userId = session?.user?.id ?? null;

    const assignment = await shiftAssignmentService.updateAssignment(
      cuid,
      {
        ...payload,
        updated_by: userId
      },
      email
    );

    return updateSuccessResponse('ShiftAssignment', assignment.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * DELETE /api/shift-assignments/:cuid
 * Hard‑deletes a shift assignment.
 */
export async function DELETE({ params, locals }) {
  try {
    permissionGuard.requireAuth(locals.user);
    const email = locals.user?.email || '';
    const cuid = parseCuid(params.cuid);

    await shiftAssignmentService.deleteAssignment(cuid, email);

    return deleteSuccessResponse('ShiftAssignment', cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
