// src/lib/server/validators/shift-assignment.validator.ts
import type { ShiftAssignmentCreateDTO, ShiftAssignmentUpdateDTO } from '$lib/types/shift-assignment';

function rejectUnknownKeys(payload: Record<string, unknown>, allowedKeys: string[]): void {
  const payloadKeys = Object.keys(payload);
  const unknownKeys = payloadKeys.filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    const err: any = new Error(`Unknown field(s) in request payload: ${unknownKeys.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validate payload for creating a shift assignment.
 */
export function validateCreatePayload(payload: unknown): ShiftAssignmentCreateDTO {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Request body must be a valid JSON object');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  rejectUnknownKeys(raw, ['employee_cuid', 'shift_cuid', 'effective_from', 'effective_to', 'status', 'created_by', 'updated_by']);

  const requiredFields = ['employee_cuid', 'shift_cuid', 'effective_from', 'effective_to'];
  for (const field of requiredFields) {
    if (raw[field] === undefined || raw[field] === null || String(raw[field]).trim() === '') {
      const err: any = new Error(`${field.replace('_', ' ')} is required`);
      err.status = 400;
      throw err;
    }
  }

  if (typeof raw.employee_cuid !== 'string') {
    const err: any = new Error('Employee CUID must be a string');
    err.status = 400;
    throw err;
  }

  if (typeof raw.shift_cuid !== 'string') {
    const err: any = new Error('Shift CUID must be a string');
    err.status = 400;
    throw err;
  }

  if (typeof raw.effective_from !== 'string' || !isValidDateString(raw.effective_from)) {
    const err: any = new Error('Effective From must be a valid date in YYYY-MM-DD format');
    err.status = 400;
    throw err;
  }

  if (typeof raw.effective_to !== 'string' || !isValidDateString(raw.effective_to)) {
    const err: any = new Error('Effective To must be a valid date in YYYY-MM-DD format');
    err.status = 400;
    throw err;
  }

  const fromDate = new Date(raw.effective_from);
  const toDate = new Date(raw.effective_to);

  if (toDate.getTime() < fromDate.getTime()) {
    const err: any = new Error('Effective To date must be greater than or equal to Effective From date');
    err.status = 400;
    throw err;
  }

  return {
    employee_cuid: raw.employee_cuid.trim(),
    shift_cuid: raw.shift_cuid.trim(),
    effective_from: raw.effective_from.trim(),
    effective_to: raw.effective_to.trim(),
    status: raw.status !== undefined ? Boolean(raw.status) : true,
    created_by: raw.created_by !== undefined ? (raw.created_by as string | null) : undefined,
    updated_by: raw.updated_by !== undefined ? (raw.updated_by as string | null) : undefined
  };
}

/**
 * Validate payload for updating a shift assignment.
 */
export function validateUpdatePayload(payload: unknown): ShiftAssignmentUpdateDTO {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Request body must be a valid JSON object');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  rejectUnknownKeys(raw, ['employee_cuid', 'shift_cuid', 'effective_from', 'effective_to', 'status', 'updated_by']);

  const result: ShiftAssignmentUpdateDTO = {};

  if (raw.employee_cuid !== undefined) {
    if (raw.employee_cuid === null || typeof raw.employee_cuid !== 'string' || raw.employee_cuid.trim() === '') {
      const err: any = new Error('Employee CUID must be a non-empty string');
      err.status = 400;
      throw err;
    }
    result.employee_cuid = raw.employee_cuid.trim();
  }

  if (raw.shift_cuid !== undefined) {
    if (raw.shift_cuid === null || typeof raw.shift_cuid !== 'string' || raw.shift_cuid.trim() === '') {
      const err: any = new Error('Shift CUID must be a non-empty string');
      err.status = 400;
      throw err;
    }
    result.shift_cuid = raw.shift_cuid.trim();
  }

  if (raw.effective_from !== undefined) {
    if (raw.effective_from === null || typeof raw.effective_from !== 'string' || !isValidDateString(raw.effective_from)) {
      const err: any = new Error('Effective From must be a valid date in YYYY-MM-DD format');
      err.status = 400;
      throw err;
    }
    result.effective_from = raw.effective_from.trim();
  }

  if (raw.effective_to !== undefined) {
    if (raw.effective_to === null || typeof raw.effective_to !== 'string' || !isValidDateString(raw.effective_to)) {
      const err: any = new Error('Effective To must be a valid date in YYYY-MM-DD format');
      err.status = 400;
      throw err;
    }
    result.effective_to = raw.effective_to.trim();
  }

  if (raw.status !== undefined) {
    if (raw.status === null || typeof raw.status !== 'boolean') {
      const err: any = new Error('Status must be a boolean');
      err.status = 400;
      throw err;
    }
    result.status = raw.status;
  }

  if (raw.updated_by !== undefined) {
    result.updated_by = raw.updated_by !== null ? String(raw.updated_by) : null;
  }

  if (Object.keys(result).length === 0) {
    const err: any = new Error('At least one field must be provided for update');
    err.status = 400;
    throw err;
  }

  return result;
}
