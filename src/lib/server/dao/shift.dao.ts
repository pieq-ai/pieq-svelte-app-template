// src/lib/server/dao/shift.dao.ts
import { db } from '$lib/server/db.js';
import type { Shift, ShiftCreateDTO, ShiftUpdateDTO } from '$lib/types/shift';

function parseTimeToDate(timeVal: Date | string | undefined, defaultTimeIso: string): Date {
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

/**
 * Create a new shift.
 */
export async function createShift(data: ShiftCreateDTO): Promise<Shift> {
  const startTime = parseTimeToDate(data.start_time, '1970-01-01T09:00:00.000Z');
  const endTime = parseTimeToDate(data.end_time, '1970-01-01T18:00:00.000Z');
  
  let minHours = data.minimum_work_hours !== undefined ? data.minimum_work_hours : 8.0;
  if (data.start_time !== undefined && data.end_time !== undefined) {
    const diffMs = endTime.getTime() - startTime.getTime();
    let diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 0) {
      diffHrs += 24;
    }
    // Only auto-calculate if minimum_work_hours was NOT explicitly provided
    if (data.minimum_work_hours === undefined) {
      minHours = Math.round(diffHrs * 100) / 100;
    }
  }

  return db.shift.create({
    data: {
      name: data.name.trim(),
      start_time: startTime,
      end_time: endTime,
      minimum_work_hours: minHours,
      status: true,
      created_by: data.created_by ?? null,
      updated_by: data.updated_by ?? null
    },
    select: {
      cuid: true,
      name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true,
      created_by: true,
      updated_by: true
    }
  }) as unknown as Promise<Shift>;
}

/**
 * Get a list of active shifts.
 */
export async function getShifts(): Promise<Shift[]> {
  return db.shift.findMany({
    where: { status: true },
    orderBy: { id: 'asc' },
    select: {
      cuid: true,
      name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true,
      created_by: true,
      updated_by: true
    }
  }) as unknown as Promise<Shift[]>;
}

/**
 * Get a list of ALL shifts (active + inactive).
 */
export async function getAllShifts(): Promise<Shift[]> {
  return db.shift.findMany({
    orderBy: { id: 'asc' },
    select: {
      cuid: true,
      name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true,
      created_by: true,
      updated_by: true
    }
  }) as unknown as Promise<Shift[]>;
}

/**
 * Count ALL shifts including inactive.
 */
export async function countAllShifts(): Promise<number> {
  return db.shift.count();
}

/**
 * Count active shifts (used for pagination metadata).
 */
export async function countShifts(): Promise<number> {
  return db.shift.count({ where: { status: true } });
}

/**
 * Retrieve a shift by its CUID.
 */
export async function getShiftByCuid(cuid: string): Promise<Shift | null> {
  return db.shift.findUnique({
    where: { cuid },
    select: {
      cuid: true,
      name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true,
      created_by: true,
      updated_by: true
    }
  }) as unknown as Promise<Shift | null>;
}

/**
 * Update an existing shift.
 * If minimum_work_hours is explicitly provided, use it directly.
 * Otherwise, auto-calculate from start/end times when they change.
 */
export async function updateShift(cuid: string, data: ShiftUpdateDTO): Promise<Shift> {
  const updateData: any = {};
  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }
  if (data.start_time !== undefined) {
    updateData.start_time = parseTimeToDate(data.start_time, '1970-01-01T09:00:00.000Z');
  }
  if (data.end_time !== undefined) {
    updateData.end_time = parseTimeToDate(data.end_time, '1970-01-01T18:00:00.000Z');
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.updated_by !== undefined) {
    updateData.updated_by = data.updated_by;
  }

  // minimum_work_hours resolution:
  // 1. If explicitly provided by caller, use that value directly.
  // 2. If times changed but no explicit minimum provided, auto-recalculate.
  if (data.minimum_work_hours !== undefined) {
    updateData.minimum_work_hours = data.minimum_work_hours;
  } else if (data.start_time !== undefined || data.end_time !== undefined) {
    let startTime = data.start_time !== undefined ? parseTimeToDate(data.start_time, '1970-01-01T09:00:00.000Z') : undefined;
    let endTime = data.end_time !== undefined ? parseTimeToDate(data.end_time, '1970-01-01T18:00:00.000Z') : undefined;

    if (startTime === undefined || endTime === undefined) {
      const existing = await getShiftByCuid(cuid);
      if (existing) {
        if (startTime === undefined) {
          startTime = parseTimeToDate(existing.start_time, '1970-01-01T09:00:00.000Z');
        }
        if (endTime === undefined) {
          endTime = parseTimeToDate(existing.end_time, '1970-01-01T18:00:00.000Z');
        }
      }
    }

    if (startTime !== undefined && endTime !== undefined) {
      const diffMs = endTime.getTime() - startTime.getTime();
      let diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs < 0) {
        diffHrs += 24;
      }
      updateData.minimum_work_hours = Math.round(diffHrs * 100) / 100;
    }
  }

  return db.shift.update({
    where: { cuid },
    data: updateData,
    select: {
      cuid: true,
      name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true,
      created_by: true,
      updated_by: true
    }
  }) as unknown as Promise<Shift>;
}

/**
 * Soft‑delete (deactivate) a shift.
 */
export async function deactivateShift(cuid: string): Promise<Shift> {
  return db.shift.update({
    where: { cuid },
    data: { status: false },
    select: {
      cuid: true,
      name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true,
      created_by: true,
      updated_by: true
    }
  }) as unknown as Promise<Shift>;
}

/**
 * Activate a deactivated shift.
 */
export async function activateShift(cuid: string): Promise<Shift> {
  return db.shift.update({
    where: { cuid },
    data: { status: true },
    select: {
      cuid: true,
      name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true,
      created_by: true,
      updated_by: true
    }
  }) as unknown as Promise<Shift>;
}
