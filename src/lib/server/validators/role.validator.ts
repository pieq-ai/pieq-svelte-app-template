// src/lib/server/validators/role.validator.ts
import type { RoleCreateDTO, RoleUpdateDTO } from '$lib/types/role';

/**
 * Simple utility to trim a string and return undefined if it becomes empty.
 */
function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

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

function validateRoleName(value: unknown): string {
  if (typeof value !== 'string') {
    const err: any = new Error('Role name is required');
    err.status = 400;
    throw err;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    const err: any = new Error('Role name is required');
    err.status = 400;
    throw err;
  }
  if (trimmed.length < 2) {
    const err: any = new Error('Minimum 2 characters required');
    err.status = 400;
    throw err;
  }
  if (trimmed.length > 255) {
    const err: any = new Error('Role name exceeds maximum length of 255 characters');
    err.status = 400;
    throw err;
  }
  const nameRegex = /^[A-Za-z ]+$/;
  if (!nameRegex.test(trimmed)) {
    const err: any = new Error('Role name must contain only letters and spaces');
    err.status = 400;
    throw err;
  }
  return trimmed;
}

/**
 * Validate payload for creating a role.
 */
export function validateCreatePayload(payload: unknown): RoleCreateDTO {
  if (typeof payload !== 'object' || payload === null) {
    const err: any = new Error('Invalid request payload');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  rejectUnknownKeys(raw, ['name', 'created_by', 'updated_by']);
  rejectUnknownKeys(raw, ['name', 'created_by', 'updated_by']);

  if (raw.name === undefined || raw.name === null) {
    const err: any = new Error('Role name is required');
    err.status = 400;
    throw err;
  }

  const name = validateRoleName(raw.name);

  return { name, created_by: raw.created_by as string | null | undefined, updated_by: raw.updated_by as string | null | undefined };
}

/**
 * Validate payload for updating a role.
 */
export function validateUpdatePayload(payload: unknown): RoleUpdateDTO {
  if (typeof payload !== 'object' || payload === null) {
    const err: any = new Error('Invalid request payload');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  rejectUnknownKeys(raw, ['name', 'status', 'created_by', 'updated_by']);
  rejectUnknownKeys(raw, ['name', 'status', 'created_by', 'updated_by']);

  const result: RoleUpdateDTO = {};

  if (raw.name !== undefined) {
    if (raw.name === null) {
      const err: any = new Error('Role name is required');
      err.status = 400;
      throw err;
    }
    result.name = validateRoleName(raw.name);
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
    const err: any = new Error('At least one field must be provided for update');
    err.status = 400;
    throw err;
  }

  return result;
}
