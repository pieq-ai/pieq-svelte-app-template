// src/lib/server/dao/shift.dao.ts
import { db } from '$lib/server/db.js';
import type { Shift, ShiftCreateDTO, ShiftUpdateDTO } from '$lib/types/shift';

/**
 * Create a new shift.
 */
export async function createShift(data: ShiftCreateDTO): Promise<Shift> {
  const startTime = data.start_time ? new Date(data.start_time) : new Date('1970-01-01T09:00:00Z');
  const endTime = data.end_time ? new Date(data.end_time) : new Date('1970-01-01T18:00:00Z');
  
  let minHours = data.minimum_work_hours !== undefined ? data.minimum_work_hours : 8.0;
  if (data.start_time !== undefined && data.end_time !== undefined) {
    const diffMs = endTime.getTime() - startTime.getTime();
    let diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 0) {
      diffHrs += 24;
    }
    minHours = Math.round(diffHrs * 100) / 100;
  }

  return db.shift.create({
    data: {
      shift_name: data.shift_name.trim(),
      start_time: startTime,
      end_time: endTime,
      minimum_work_hours: minHours,
      status: true
    },
    select: {
      cuid: true,
      shift_name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true
    }
  }) as unknown as Promise<Shift>;
}

/**
 * Get a paginated list of active shifts.
 */
export async function getShifts(page: number, limit: number): Promise<Shift[]> {
  const skip = (page - 1) * limit;
  return db.shift.findMany({
    where: { status: true },
    orderBy: { id: 'asc' },
    skip,
    take: limit,
    select: {
      cuid: true,
      shift_name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true
    }
  }) as unknown as Promise<Shift[]>;
}

/**
 * Get a paginated list of ALL shifts (active + inactive).
 */
export async function getAllShifts(page: number, limit: number): Promise<Shift[]> {
  const skip = (page - 1) * limit;
  return db.shift.findMany({
    orderBy: { id: 'asc' },
    skip,
    take: limit,
    select: {
      cuid: true,
      shift_name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true
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
      shift_name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true
    }
  }) as unknown as Promise<Shift | null>;
}

/**
 * Update an existing shift.
 */
export async function updateShift(cuid: string, data: ShiftUpdateDTO): Promise<Shift> {
  const updateData: any = {};
  if (data.shift_name !== undefined) {
    updateData.shift_name = data.shift_name.trim();
  }
  if (data.start_time !== undefined) {
    updateData.start_time = new Date(data.start_time);
  }
  if (data.end_time !== undefined) {
    updateData.end_time = new Date(data.end_time);
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.start_time !== undefined || data.end_time !== undefined) {
    let startTime = data.start_time !== undefined ? new Date(data.start_time) : undefined;
    let endTime = data.end_time !== undefined ? new Date(data.end_time) : undefined;

    if (startTime === undefined || endTime === undefined) {
      const existing = await getShiftByCuid(cuid);
      if (existing) {
        if (startTime === undefined) {
          startTime = new Date(existing.start_time);
        }
        if (endTime === undefined) {
          endTime = new Date(existing.end_time);
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
  } else if (data.minimum_work_hours !== undefined) {
    updateData.minimum_work_hours = data.minimum_work_hours;
  }

  return db.shift.update({
    where: { cuid },
    data: updateData,
    select: {
      cuid: true,
      shift_name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true
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
      shift_name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true
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
      shift_name: true,
      start_time: true,
      end_time: true,
      minimum_work_hours: true,
      status: true
    }
  }) as unknown as Promise<Shift>;
}
