// src/lib/server/services/shift.service.ts
import * as shiftDao from '$lib/server/dao/shift.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/shift.validator.js';

/** List only active shifts with pagination. */
export async function listShifts(query: Record<string, any>) {
  const { page, limit } = validatePaginationParams(query);
  const total = await shiftDao.countShifts();
  const data = await shiftDao.getShifts(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** List ALL shifts (active + inactive) with pagination — used by UI shift management. */
export async function listAllShifts(query: Record<string, any>) {
  const { page, limit } = validatePaginationParams(query);
  const total = await shiftDao.countAllShifts();
  const data = await shiftDao.getAllShifts(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** Create a new shift after validation and duplicate check. */
export async function createShift(payload: any) {
  const valid = validateCreatePayload(payload);
  
  // Ensure unique active name
  const existing = await shiftDao.getShifts(1, 1000);
  if (existing.some((s) => s.shift_name.toLowerCase() === valid.shift_name.toLowerCase())) {
    const err: any = new Error('Shift name already exists');
    err.status = 409;
    throw err;
  }
  
  return shiftDao.createShift(valid);
}

/** Update existing shift. */
export async function updateShift(id: number, payload: any) {
  const valid = validateUpdatePayload(payload);
  
  const shift = await shiftDao.getShiftById(id);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  
  // Duplicate name check if name provided
  if (valid.shift_name) {
    const existing = await shiftDao.getShifts(1, 1000);
    if (existing.some((s) => s.shift_name.toLowerCase() === valid.shift_name.toLowerCase() && s.shift_id !== id)) {
      const err: any = new Error('Shift name already exists');
      err.status = 409;
      throw err;
    }
  }
  
  return shiftDao.updateShift(id, valid);
}

/** Soft delete / deactivate a shift. */
export async function deleteShift(id: number) {
  const shift = await shiftDao.getShiftById(id);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  
  return shiftDao.deactivateShift(id);
}

/** Activate a shift. */
export async function activateShift(id: number) {
  const shift = await shiftDao.getShiftById(id);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  
  return shiftDao.activateShift(id);
}
