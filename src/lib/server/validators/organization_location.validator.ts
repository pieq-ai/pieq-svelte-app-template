// src/lib/server/validators/organization_location.validator.ts

/**
 * Validate pagination query parameters.
 */
export function validatePaginationParams(query: Record<string, any>) {
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
 * Validate payload for creating a company location.
 */
export function validateCreatePayload(payload: any) {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }

  if (payload.location_name === undefined || payload.location_name === null) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }

  if (typeof payload.location_name !== 'string') {
    const err: any = new Error('Company Location name must be a string');
    err.status = 400;
    throw err;
  }

  const name = payload.location_name.trim();

  if (name.length === 0) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }

  if (name.length < 2) {
    const err: any = new Error('Company Location name must be at least 2 characters');
    err.status = 400;
    throw err;
  }

  if (name.length > 255) {
    const err: any = new Error('Company Location name exceeds maximum length of 255 characters');
    err.status = 400;
    throw err;
  }

  const lower = name.toLowerCase();

  // XSS & SQL Injection protections
  if (
    lower.includes('<script') ||
    lower.includes('script>') ||
    lower.includes('drop table') ||
    lower.includes('select ') ||
    lower.includes('--') ||
    lower.includes('/*')
  ) {
    const err: any = new Error('Company Location name contains potential security threat');
    err.status = 400;
    throw err;
  }

  // Reject numbers-only
  if (/^\d+$/.test(name)) {
    const err: any = new Error('Company Location name cannot contain only numbers');
    err.status = 400;
    throw err;
  }

  // Must contain at least one alphabet (rejects symbols-only and numbers-only)
  if (!/[A-Za-z]/.test(name)) {
    const err: any = new Error('Company Location name must contain at least one alphabet');
    err.status = 400;
    throw err;
  }

  // Number validation: reject numbers directly attached to letters (like Location1, Branch99)
  if (/[A-Za-z]\d|\d[A-Za-z]/.test(name)) {
    const err: any = new Error('Company Location name cannot contain numbers');
    err.status = 400;
    throw err;
  }

  return {
    location_name: name
  };
}

/**
 * Validate payload for updating a company location.
 */
export function validateUpdatePayload(payload: any) {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }

  const result: {
    location_name?: string;
    is_active?: boolean;
  } = {};

  if (payload.location_name !== undefined) {
    if (payload.location_name === null) {
      const err: any = new Error('Company Location name must be a string');
      err.status = 400;
      throw err;
    }

    if (typeof payload.location_name !== 'string') {
      const err: any = new Error('Company Location name must be a string');
      err.status = 400;
      throw err;
    }

    const name = payload.location_name.trim();

    if (name.length === 0) {
      const err: any = new Error('Company Location name is required');
      err.status = 400;
      throw err;
    }

    if (name.length < 2) {
      const err: any = new Error('Company Location name must be at least 2 characters');
      err.status = 400;
      throw err;
    }

    if (name.length > 255) {
      const err: any = new Error('Company Location name exceeds maximum length of 255 characters');
      err.status = 400;
      throw err;
    }

    const lower = name.toLowerCase();

    // XSS & SQL Injection protections
    if (
      lower.includes('<script') ||
      lower.includes('script>') ||
      lower.includes('drop table') ||
      lower.includes('select ') ||
      lower.includes('--') ||
      lower.includes('/*')
    ) {
      const err: any = new Error('Company Location name contains potential security threat');
      err.status = 400;
      throw err;
    }

    // Reject numbers-only
    if (/^\d+$/.test(name)) {
      const err: any = new Error('Company Location name cannot contain only numbers');
      err.status = 400;
      throw err;
    }

    // Must contain at least one alphabet
    if (!/[A-Za-z]/.test(name)) {
      const err: any = new Error('Company Location name must contain at least one alphabet');
      err.status = 400;
      throw err;
    }

    // Number validation: reject numbers directly attached to letters
    if (/[A-Za-z]\d|\d[A-Za-z]/.test(name)) {
      const err: any = new Error('Company Location name cannot contain numbers');
      err.status = 400;
      throw err;
    }

    result.location_name = name;
  }

  if (payload.is_active !== undefined) {
    if (typeof payload.is_active !== 'boolean') {
      const err: any = new Error('is_active must be a boolean');
      err.status = 400;
      throw err;
    }
    result.is_active = payload.is_active;
  }

  if (Object.keys(result).length === 0) {
    const err: any = new Error('At least one valid field must be provided for update');
    err.status = 400;
    throw err;
  }

  return result;
}
