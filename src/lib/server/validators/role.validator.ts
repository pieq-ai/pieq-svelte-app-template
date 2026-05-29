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
  rejectUnknownKeys(raw, ['name']);

  const name = sanitizeString(raw.name);
  if (!name) {
    const err: any = new Error('Name is required and cannot be empty');
    err.status = 400;
    throw err;
  }

  // Name must contain only letters and spaces, max 255 chars
  const nameRegex = /^[A-Za-z ]+$/;
  if (!nameRegex.test(name)) {
    const err: any = new Error('Name must contain only letters and spaces');
    err.status = 400;
    throw err;
  }

  if (name.length > 255) {
    const err: any = new Error('Name exceeds maximum length of 255 characters');
    err.status = 400;
    throw err;
  }

  return { name };
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
  rejectUnknownKeys(raw, ['name', 'status']);

  const result: RoleUpdateDTO = {};

  if (raw.name !== undefined) {
    const name = sanitizeString(raw.name);
    if (!name) {
      const err: any = new Error('Name cannot be empty or whitespace');
      err.status = 400;
      throw err;
    }
    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(name)) {
      const err: any = new Error('Name must contain only letters and spaces');
      err.status = 400;
      throw err;
    }
    if (name.length > 255) {
      const err: any = new Error('Name exceeds maximum length of 255 characters');
      err.status = 400;
      throw err;
    }
    result.name = name;
  }

  if (raw.status !== undefined) {
    if (typeof raw.status !== 'boolean') {
      const err: any = new Error('Status must be a boolean');
      err.status = 400;
      throw err;
    }
    result.status = raw.status;
  }

  if (Object.keys(result).length === 0) {
    const err: any = new Error('At least one field must be provided for update');
    err.status = 400;
    throw err;
  }

  return result;
}
