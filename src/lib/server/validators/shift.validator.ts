// src/lib/server/validators/shift.validator.ts
import type { ShiftCreateDTO, ShiftUpdateDTO } from '$lib/types/shift';

/**
 * Rejects any fields not present in the allowed list.
 */
function rejectUnknownKeys(payload: Record<string, unknown>, allowedKeys: string[]): void {
  const payloadKeys = Object.keys(payload);
  const unknownKeys = payloadKeys.filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    const err: any = new Error(`Unknown field(s) in request payload: ${unknownKeys.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

/**
 * Validate pagination query parameters.
 */
export function validatePaginationParams(query: Record<string, unknown>): { page: number; limit: number } {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  let page = Number(query.page ?? DEFAULT_PAGE);
  let limit = Number(query.limit ?? DEFAULT_LIMIT);

  if (isNaN(page) || !Number.isInteger(page) || page < 1) {
    const err: any = new Error('Invalid pagination parameter: page must be a positive integer');
    err.status = 400;
    throw err;
  }

  if (isNaN(limit) || !Number.isInteger(limit) || limit < 1) {
    const err: any = new Error('Invalid pagination parameter: limit must be a positive integer');
    err.status = 400;
    throw err;
  }

  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit };
}

/**
 * Validate payload for creating a shift.
 */
export function validateCreatePayload(payload: unknown): ShiftCreateDTO {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Shift name is required');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  rejectUnknownKeys(raw, ['shift_name', 'start_time', 'end_time', 'minimum_work_hours', 'status', 'created_by', 'updated_by']);

  if (raw.shift_name === undefined || raw.shift_name === null) {
    const err: any = new Error('Shift name is required');
    err.status = 400;
    throw err;
  }

  if (typeof raw.shift_name !== 'string') {
    const err: any = new Error('Shift name must be a string');
    err.status = 400;
    throw err;
  }

  const shiftName = raw.shift_name.trim();

  if (shiftName.length === 0) {
    const err: any = new Error('Shift name is required');
    err.status = 400;
    throw err;
  }

  if (shiftName.length < 2) {
    const err: any = new Error('Shift name must be at least 2 characters');
    err.status = 400;
    throw err;
  }

  if (/\d/.test(shiftName)) {
    const err: any = new Error('Shift name cannot contain numbers');
    err.status = 400;
    throw err;
  }

  if (!/^[A-Za-z ]+$/.test(shiftName)) {
    const err: any = new Error('Shift name cannot contain special characters');
    err.status = 400;
    throw err;
  }

  if (shiftName.length > 255) {
    const err: any = new Error('Shift name exceeds maximum length of 255 characters');
    err.status = 400;
    throw err;
  }

  return {
    shift_name: shiftName,
    start_time: raw.start_time as string | undefined,
    end_time: raw.end_time as string | undefined,
    minimum_work_hours: (() => {
      if (raw.minimum_work_hours === undefined) return undefined;
      const val = Number(raw.minimum_work_hours);
      if (isNaN(val) || val <= 0) {
        const err: any = new Error('Minimum work hours must be greater than zero');
        err.status = 400;
        throw err;
      }
      return val;
    })(),
    status: raw.status !== undefined ? Boolean(raw.status) : undefined,
    created_by: raw.created_by !== undefined ? (raw.created_by as string | null) : undefined,
    updated_by: raw.updated_by !== undefined ? (raw.updated_by as string | null) : undefined
  };
}

/**
 * Validate payload for updating a shift.
 */
export function validateUpdatePayload(payload: unknown): ShiftUpdateDTO {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Shift name is required');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  rejectUnknownKeys(raw, ['shift_name', 'start_time', 'end_time', 'minimum_work_hours', 'status', 'created_by', 'updated_by']);

  const result: ShiftUpdateDTO = {};

  if (raw.shift_name !== undefined) {
    if (raw.shift_name === null) {
      const err: any = new Error('Shift name must be a string');
      err.status = 400;
      throw err;
    }

    if (typeof raw.shift_name !== 'string') {
      const err: any = new Error('Shift name must be a string');
      err.status = 400;
      throw err;
    }

    const shiftName = raw.shift_name.trim();

    if (shiftName.length === 0) {
      const err: any = new Error('Shift name is required');
      err.status = 400;
      throw err;
    }

    if (shiftName.length < 2) {
      const err: any = new Error('Shift name must be at least 2 characters');
      err.status = 400;
      throw err;
    }

    if (/\d/.test(shiftName)) {
      const err: any = new Error('Shift name cannot contain numbers');
      err.status = 400;
      throw err;
    }

    if (!/^[A-Za-z ]+$/.test(shiftName)) {
      const err: any = new Error('Shift name cannot contain special characters');
      err.status = 400;
      throw err;
    }

    if (shiftName.length > 255) {
      const err: any = new Error('Shift name exceeds maximum length of 255 characters');
      err.status = 400;
      throw err;
    }

    result.shift_name = shiftName;
  }

  if (raw.start_time !== undefined) {
    result.start_time = raw.start_time as string;
  }
  if (raw.end_time !== undefined) {
    result.end_time = raw.end_time as string;
  }
  if (raw.minimum_work_hours !== undefined) {
    const val = Number(raw.minimum_work_hours);
    if (isNaN(val) || val <= 0) {
      const err: any = new Error('Minimum work hours must be greater than zero');
      err.status = 400;
      throw err;
    }
    result.minimum_work_hours = val;
  }
  if (raw.status !== undefined) {
    if (typeof raw.status !== 'boolean') {
      const err: any = new Error('Status must be a boolean');
      err.status = 400;
      throw err;
    }
    result.status = raw.status;
  }

  if (raw.created_by !== undefined) {
    result.created_by = raw.created_by as string | null;
  }
  if (raw.updated_by !== undefined) {
    result.updated_by = raw.updated_by as string | null;
  }

  if (Object.keys(result).length === 0) {
    const err: any = new Error('At least one valid field must be provided for update');
    err.status = 400;
    throw err;
  }

  return result;
}
