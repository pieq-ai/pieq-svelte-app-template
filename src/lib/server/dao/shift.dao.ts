// src/lib/server/dao/shift.dao.ts
import { db } from '$lib/server/db.js';
import type { Shift, ShiftCreateDTO, ShiftUpdateDTO } from '$lib/types/shift';

/**
 * Create a new shift.
 */
export async function createShift(data: ShiftCreateDTO): Promise<Shift> {
  const startTime = data.start_time ? new Date(data.start_time) : new Date('1970-01-01T09:00:00Z');
  const endTime = data.end_time ? new Date(data.end_time) : new Date('1970-01-01T18:00:00Z');
  const minHours = data.minimum_work_hours !== undefined ? data.minimum_work_hours : 8.0;

  return db.shift.create({
    data: {
      shift_name: data.shift_name.trim(),
      start_time: startTime,
      end_time: endTime,
      minimum_work_hours: minHours,
      status: 'active'
    },
  }) as unknown as Promise<Shift>;
}

/**
 * Get a paginated list of active shifts.
 */
export async function getShifts(page: number, limit: number): Promise<Shift[]> {
  const skip = (page - 1) * limit;
  return db.shift.findMany({
    where: { status: 'active' },
    orderBy: { shift_id: 'asc' },
    skip,
    take: limit,
  }) as unknown as Promise<Shift[]>;
}

/**
 * Get a paginated list of ALL shifts (active + inactive).
 */
export async function getAllShifts(page: number, limit: number): Promise<Shift[]> {
  const skip = (page - 1) * limit;
  return db.shift.findMany({
    orderBy: { shift_id: 'asc' },
    skip,
    take: limit,
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
  return db.shift.count({ where: { status: 'active' } });
}

/**
 * Retrieve a shift by its numeric ID.
 */
export async function getShiftById(shiftId: number): Promise<Shift | null> {
  return db.shift.findUnique({ where: { shift_id: shiftId } }) as unknown as Promise<Shift | null>;
}

/**
 * Update an existing shift.
 */
export async function updateShift(shiftId: number, data: ShiftUpdateDTO): Promise<Shift> {
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
  if (data.minimum_work_hours !== undefined) {
    updateData.minimum_work_hours = data.minimum_work_hours;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  return db.shift.update({
    where: { shift_id: shiftId },
    data: updateData,
  }) as unknown as Promise<Shift>;
}

/**
 * Soft‑delete (deactivate) a shift.
 */
export async function deactivateShift(shiftId: number): Promise<Shift> {
  return db.shift.update({
    where: { shift_id: shiftId },
    data: { status: 'inactive' }
  }) as unknown as Promise<Shift>;
}

/**
 * Activate a deactivated shift.
 */
export async function activateShift(shiftId: number): Promise<Shift> {
  return db.shift.update({
    where: { shift_id: shiftId },
    data: { status: 'active' }
  }) as unknown as Promise<Shift>;
}
