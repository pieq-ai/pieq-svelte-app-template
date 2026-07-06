import type { RequestEvent } from '@sveltejs/kit';
// src/routes/api/shift-assignments/+server.ts
import { json } from '@sveltejs/kit';
import * as shiftAssignmentService from '$lib/server/services/shift-assignment.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { successResponse, createSuccessResponse } from '$lib/server/response.js';

export function _mapShiftAssignment(sa: any) {
  return {
    cuid: sa.cuid,
    employee_cuid: sa.employee_cuid,
    shift_cuid: sa.shift_cuid,
    effective_from: sa.effective_from instanceof Date 
      ? sa.effective_from.toISOString().split('T')[0]
      : new Date(sa.effective_from).toISOString().split('T')[0],
    effective_to: sa.effective_to
      ? (sa.effective_to instanceof Date 
        ? sa.effective_to.toISOString().split('T')[0]
        : new Date(sa.effective_to).toISOString().split('T')[0])
      : null,
    status: sa.status,
    created_by: sa.created_by ?? null,
    updated_by: sa.updated_by ?? null,
    employee: sa.employee ? {
      first_name: sa.employee.first_name,
      last_name: sa.employee.last_name,
      emp_code: sa.employee.emp_code
    } : undefined,
    shift: sa.shift ? {
      name: sa.shift.name,
      start_time: sa.shift.start_time,
      end_time: sa.shift.end_time
    } : undefined
  };
}

/**
 * GET /api/shift-assignments
 * Returns a list of shift assignments for the reporting subordinates of the logged-in manager.
 */
export async function GET({ locals }: RequestEvent) {
  try {
    permissionGuard.requireAuth(locals.user);
    const email = locals.user?.email || '';

    const list = await shiftAssignmentService.listAssignments(email);
    const formatted = list.map(_mapShiftAssignment);

    return successResponse(formatted);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * POST /api/shift-assignments
 * Creates a new shift assignment.
 */
export async function POST({ request, locals }: RequestEvent) {
  try {
    permissionGuard.requireAuth(locals.user);
    const email = locals.user?.email || '';

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

    // Attach auditing info
    const session = await locals.auth();
    const userId = session?.user?.id ?? null;
    
    const assignment = await shiftAssignmentService.createAssignment(
      {
        ...payload,
        created_by: userId,
        updated_by: userId
      },
      email
    );

    return createSuccessResponse('ShiftAssignment', assignment.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
