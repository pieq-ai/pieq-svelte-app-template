// src/lib/server/services/shift.service.ts
import type { ShiftCreateDTO, ShiftUpdateDTO, Shift } from '$lib/types/shift';
import * as shiftDao from '$lib/server/dao/shift.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/shift.validator.js';
import * as auditService from '$lib/server/services/audit.service.js';

export function parseTimeToDate(timeVal: Date | string | undefined, defaultTimeIso: string): Date {
  if (!timeVal) return new Date(defaultTimeIso);
  if (timeVal instanceof Date) return timeVal;
  if (typeof timeVal === 'string') {
    if (timeVal.includes('T') || timeVal.includes('-')) {
      const d = new Date(timeVal);
      if (!isNaN(d.getTime())) return d;
    }
    const parts = timeVal.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      const seconds = parts.length > 2 ? parts[2].substring(0, 2).padStart(2, '0') : '00';
      return new Date(`1970-01-01T${hours}:${minutes}:${seconds}.000Z`);
    }
  }
  return new Date(timeVal);
}

function formatTimeToHHMMSS(timeVal: Date | string | undefined, defaultTime: string): string {
  if (!timeVal) return defaultTime;
  
  if (timeVal instanceof Date) {
    const hours = String(timeVal.getUTCHours()).padStart(2, '0');
    const minutes = String(timeVal.getUTCMinutes()).padStart(2, '0');
    const seconds = String(timeVal.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  if (typeof timeVal === 'string') {
    if (timeVal.includes('T') || timeVal.includes('-')) {
      const d = new Date(timeVal);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        const seconds = String(d.getUTCSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      }
    }
    const parts = timeVal.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      const seconds = parts.length > 2 ? parts[2].substring(0, 2).padStart(2, '0') : '00';
      return `${hours}:${minutes}:${seconds}`;
    }
  }

  return defaultTime;
}

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
  
  // Ensure unique name across active and inactive shifts
  const nameToCheck = valid.name.trim().toLowerCase();
  const existing = await shiftDao.getAllShifts();
  if (existing.some((s) => s.name.trim().toLowerCase() === nameToCheck)) {
    const err: any = new Error('Shift name already exists');
    err.status = 409;
    throw err;
  }

  // Duplicate timing validation: No two ACTIVE shifts can share the exact same combination of start_time and end_time.
  const startHHMMSS = formatTimeToHHMMSS(valid.start_time, '09:00:00');
  const endHHMMSS = formatTimeToHHMMSS(valid.end_time, '18:00:00');

  if (existing.some((s) => {
    return formatTimeToHHMMSS(s.start_time, '09:00:00') === startHHMMSS &&
           formatTimeToHHMMSS(s.end_time, '18:00:00') === endHHMMSS;
  })) {
    const err: any = new Error('Shift timing range already exists');
    err.status = 409;
    throw err;
  }

  // Validate minimum_work_hours does not exceed the calculated shift duration
  if (valid.minimum_work_hours !== undefined && valid.start_time !== undefined && valid.end_time !== undefined) {
    const startTime = parseTimeToDate(valid.start_time, '1970-01-01T09:00:00.000Z');
    const endTime = parseTimeToDate(valid.end_time, '1970-01-01T18:00:00.000Z');
    let diffHrs = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (diffHrs < 0) diffHrs += 24;
    const maxHrs = Math.round(diffHrs * 100) / 100;
    if (valid.minimum_work_hours < 0 || valid.minimum_work_hours > maxHrs) {
      const err: any = new Error(
        `Minimum work hours must be between 0 and the total shift duration (${maxHrs} hrs)`
      );
      err.status = 422;
      throw err;
    }
  }
  
  const created = await shiftDao.createShift(valid);

  await auditService.log({
    entity_name: 'Shift',
    entity_cuid: created.cuid,
    action_type: 'create',
    status: 'SUCCESS',
    remarks: `Shift "${created.name}" created.`
  });

  return created;
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
  if (valid.name) {
    const nameToCheck = valid.name.trim().toLowerCase();
    const existing = await shiftDao.getAllShifts();
    if (existing.some((s) => s.name.trim().toLowerCase() === nameToCheck && s.cuid !== cuid)) {
      const err: any = new Error('Shift name already exists');
      err.status = 409;
      throw err;
    }
  }

  // Duplicate timing validation: ONLY run check if resulting status is active (true)!
  const targetStatus = valid.status !== undefined ? valid.status : shift.status;
  if (targetStatus) {
    const targetStart = valid.start_time !== undefined ? valid.start_time : shift.start_time;
    const targetEnd = valid.end_time !== undefined ? valid.end_time : shift.end_time;

    const startHHMMSS = formatTimeToHHMMSS(targetStart, '09:00:00');
    const endHHMMSS = formatTimeToHHMMSS(targetEnd, '18:00:00');

    const existing = await shiftDao.getShifts();
    if (existing.some((s) => {
      if (s.cuid === cuid) return false; // Exclude current record during edit operations
      return formatTimeToHHMMSS(s.start_time, '09:00:00') === startHHMMSS &&
             formatTimeToHHMMSS(s.end_time, '18:00:00') === endHHMMSS;
    })) {
      const err: any = new Error('Shift timing range already exists');
      err.status = 409;
      throw err;
    }
  }

  // Validate minimum_work_hours does not exceed the calculated shift duration
  if (valid.minimum_work_hours !== undefined) {
    const targetStart = valid.start_time !== undefined ? valid.start_time : shift.start_time;
    const targetEnd = valid.end_time !== undefined ? valid.end_time : shift.end_time;
    const startTime = parseTimeToDate(targetStart, '1970-01-01T09:00:00.000Z');
    const endTime = parseTimeToDate(targetEnd, '1970-01-01T18:00:00.000Z');
    let diffHrs = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (diffHrs < 0) diffHrs += 24;
    const maxHrs = Math.round(diffHrs * 100) / 100;
    if (valid.minimum_work_hours < 0 || valid.minimum_work_hours > maxHrs) {
      const err: any = new Error(
        `Minimum work hours must be between 0 and the total shift duration (${maxHrs} hrs)`
      );
      err.status = 422;
      throw err;
    }
  }
  
  const updated = await shiftDao.updateShift(cuid, valid);

  await auditService.logUpdate({
    entityName: 'Shift',
    entityCuid: cuid,
    oldRecord: shift,
    newRecord: updated
  });

  return updated;
}

/** Soft delete / deactivate a shift. */
export async function deleteShift(cuid: string, updatedBy?: string): Promise<Shift> {
  const shift = await shiftDao.getShiftByCuid(cuid);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }
  
  const deactivated = await shiftDao.deactivateShift(cuid, updatedBy);

  await auditService.log({
    entity_name: 'Shift',
    entity_cuid: cuid,
    action_type: 'delete',
    status: 'SUCCESS',
    remarks: `Shift "${shift.name}" soft-deleted (deactivated).`
  });

  return deactivated;
}

/** Activate a shift. */
export async function activateShift(cuid: string, updatedBy?: string): Promise<Shift> {
  const shift = await shiftDao.getShiftByCuid(cuid);
  if (!shift) {
    const err: any = new Error('Shift not found');
    err.status = 404;
    throw err;
  }

  // Prior to activating an inactive shift, check for conflicts with other active shifts
  const startHHMMSS = formatTimeToHHMMSS(shift.start_time, '09:00:00');
  const endHHMMSS = formatTimeToHHMMSS(shift.end_time, '18:00:00');

  const existing = await shiftDao.getShifts();
  if (existing.some((s) => {
    if (s.cuid === cuid) return false;
    return formatTimeToHHMMSS(s.start_time, '09:00:00') === startHHMMSS &&
           formatTimeToHHMMSS(s.end_time, '18:00:00') === endHHMMSS;
  })) {
    const err: any = new Error('Shift timing range already exists');
    err.status = 409;
    throw err;
  }
  
  const activated = await shiftDao.activateShift(cuid, updatedBy);

  await auditService.log({
    entity_name: 'Shift',
    entity_cuid: cuid,
    action_type: 'update',
    status: 'SUCCESS',
    remarks: `Shift "${shift.name}" activated.`
  });

  return activated;
}
