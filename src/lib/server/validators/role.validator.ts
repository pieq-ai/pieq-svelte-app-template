// src/lib/server/validators/role.validator.ts
/**
 * Simple utility to trim a string and return undefined if it becomes empty.
 */
function sanitizeString(value: any): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Validate pagination query parameters.
 * Returns an object with numeric page and limit.
 * Throws an error with status 400 on invalid input.
 */
export function validatePaginationParams(query: Record<string, any>) {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  let page = Number(query.page ?? DEFAULT_PAGE);
  let limit = Number(query.limit ?? DEFAULT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    const err: any = new Error('Invalid pagination parameter: page must be a positive integer');
    err.status = 400;
    throw err;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    const err: any = new Error('Invalid pagination parameter: limit must be a positive integer');
    err.status = 400;
    throw err;
  }

  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit };
}

/**
 * Validate payload for creating a role.
 * Returns a sanitized object { name, description? }.
 * Throws an error with status 400 on validation failure.
 */
export function validateCreatePayload(payload: any) {
  if (typeof payload !== 'object' || payload === null) {
    const err: any = new Error('Invalid request payload');
    err.status = 400;
    throw err;
  }

  const name = sanitizeString(payload.name);
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
 * Allows partial updates.
 * Throws an error with status 400 on invalid fields.
 */
export function validateUpdatePayload(payload: any) {
  if (typeof payload !== 'object' || payload === null) {
    const err: any = new Error('Invalid request payload');
    err.status = 400;
    throw err;
  }

  const result: { name?: string } = {};

  if (payload.name !== undefined) {
    const name = sanitizeString(payload.name);
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

  if (Object.keys(result).length === 0) {
    const err: any = new Error('At least one field must be provided for update');
    err.status = 400;
    throw err;
  }

  return result;
}
