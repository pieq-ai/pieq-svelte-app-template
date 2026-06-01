// src/lib/server/services/shift.service.ts
import type { ShiftCreateDTO, ShiftUpdateDTO, Shift } from '$lib/types/shift';
import * as shiftDao from '$lib/server/dao/shift.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/shift.validator.js';

/** List only active shifts. */
export async function listShifts(query?: Record<string, unknown>): Promise<{ data: Shift[] }> {
  const data = await shiftDao.getShifts();
  return { data };
}

/** List ALL shifts (active + inactive) — used by UI shift management. */
export async function listAllShifts(query?: Record<string, unknown>): Promise<{ data: Shift[] }> {
  const data = await shiftDao.getAllShifts();
  return { data };
}

/** Create a new shift after validation and duplicate check. */
export async function createShift(payload: unknown): Promise<Shift> {
  const valid = validateCreatePayload(payload);
  
  // Ensure unique active name
  const existing = await shiftDao.getShifts();
  if (existing.some((s) => s.shift_name.toLowerCase() === valid.shift_name.toLowerCase())) {
    const err: any = new Error('Shift name already exists');
    err.status = 409;
    throw err;
  }
  
  return shiftDao.createShift(valid);
}

/** Update existing shift. */
export async function updateShift(cuid: string, payload: unknown): Promise<Shift> {
  const valid = validateUpdatePayload(payload);
  
  const shift = await shiftDao.getShiftByCuid(cuid);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  
  // Duplicate name check if name provided
  if (valid.shift_name) {
    const existing = await shiftDao.getShifts();
    if (existing.some((s) => s.shift_name.toLowerCase() === valid.shift_name.toLowerCase() && s.cuid !== cuid)) {
      const err: any = new Error('Shift name already exists');
      err.status = 409;
      throw err;
    }
  }
  
  return shiftDao.updateShift(cuid, valid);
}

/** Soft delete / deactivate a shift. */
export async function deleteShift(cuid: string): Promise<Shift> {
  const shift = await shiftDao.getShiftByCuid(cuid);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  
  return shiftDao.deactivateShift(cuid);
}

/** Activate a shift. */
export async function activateShift(cuid: string): Promise<Shift> {
  const shift = await shiftDao.getShiftByCuid(cuid);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  
  return shiftDao.activateShift(cuid);
}
