import { requirePermission } from "$lib/server/guards/permission.guard";
import type { RequestEvent } from '@sveltejs/kit';
// src/routes/api/shifts/+server.ts
import { json } from "@sveltejs/kit";
import * as shiftService from "$lib/server/services/shift.service.js";
import { sendList, sendCreated, mapShift } from "$lib/server/response.js";

/**
 * GET /api/shifts
 * Returns paginated list of shifts.
 * Pass ?includeInactive=true to include deactivated shifts.
 */
export async function GET({ locals, url }: RequestEvent) {
  try {
    requirePermission(locals.user, "shift:view");
    const params = Object.fromEntries(url.searchParams.entries());
    const includeInactive = params.includeInactive === "true";
    const result = includeInactive
      ? await shiftService.listAllShifts()
      : await shiftService.listShifts();
    const mapped = (result.data ?? []).map(mapShift);
    return sendList(mapped);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}

/**
 * POST /api/shifts
 * Creates a new shift.
 */
export async function POST({ request, locals }: RequestEvent) {
  try {
    requirePermission(locals.user, "shift:view");
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Malformed or invalid JSON" }, { status: 400 });
    }

    payload.created_by = locals?.user?.id;
    payload.updated_by = locals?.user?.id;
    const shift = await shiftService.createShift(payload);
    return sendCreated("Shift", shift.cuid);
  } catch (err: any) {
    const status = err.status ?? 500;
    return json({ error: err.message }, { status });
  }
}
