// src/lib/server/validators/organization_location.validator.ts
import type { CompanyLocationCreateDTO, CompanyLocationUpdateDTO } from '$lib/types/organization_location';

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
 * Validate payload for creating a company location.
 */
export function validateCreatePayload(payload: unknown): CompanyLocationCreateDTO {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  const allowedKeys = [
    'location_name',
    'address_line1',
    'address_line2',
    'city',
    'state_cuid',
    'country_cuid',
    'pin_code',
    'timezone',
    'created_by',
    'updated_by'
  ];
  rejectUnknownKeys(raw, allowedKeys);

  if (raw.location_name === undefined || raw.location_name === null) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }

  if (typeof raw.location_name !== 'string') {
    const err: any = new Error('Company Location name must be a string');
    err.status = 400;
    throw err;
  }

  const name = raw.location_name.trim();

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
    location_name: name,
    address_line1: typeof raw.address_line1 === 'string' ? raw.address_line1 : undefined,
    address_line2: typeof raw.address_line2 === 'string' ? raw.address_line2 : undefined,
    city: typeof raw.city === 'string' ? raw.city : undefined,
    state_cuid: typeof raw.state_cuid === 'string' ? raw.state_cuid : undefined,
    country_cuid: typeof raw.country_cuid === 'string' ? raw.country_cuid : undefined,
    pin_code: typeof raw.pin_code === 'string' ? raw.pin_code : undefined,
    timezone: typeof raw.timezone === 'string' ? raw.timezone : undefined,
    created_by: raw.created_by !== undefined ? (raw.created_by as string | null) : undefined,
    updated_by: raw.updated_by !== undefined ? (raw.updated_by as string | null) : undefined
  };
}

/**
 * Validate payload for updating a company location.
 */
export function validateUpdatePayload(payload: unknown): CompanyLocationUpdateDTO {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }

  const raw = payload as Record<string, unknown>;
  const allowedKeys = [
    'location_name',
    'address_line1',
    'address_line2',
    'city',
    'state_cuid',
    'country_cuid',
    'pin_code',
    'timezone',
    'is_active',
    'created_by',
    'updated_by'
  ];
  rejectUnknownKeys(raw, allowedKeys);

  const result: CompanyLocationUpdateDTO = {};

  if (raw.location_name !== undefined) {
    if (raw.location_name === null) {
      const err: any = new Error('Company Location name must be a string');
      err.status = 400;
      throw err;
    }

    if (typeof raw.location_name !== 'string') {
      const err: any = new Error('Company Location name must be a string');
      err.status = 400;
      throw err;
    }

    const name = raw.location_name.trim();

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

  if (raw.address_line1 !== undefined) {
    if (typeof raw.address_line1 !== 'string') throw new Error('address_line1 must be a string');
    result.address_line1 = raw.address_line1;
  }
  if (raw.address_line2 !== undefined) {
    if (raw.address_line2 !== null && typeof raw.address_line2 !== 'string') throw new Error('address_line2 must be a string or null');
    result.address_line2 = raw.address_line2;
  }
  if (raw.city !== undefined) {
    if (typeof raw.city !== 'string') throw new Error('city must be a string');
    result.city = raw.city;
  }
  if (raw.state_cuid !== undefined) {
    if (typeof raw.state_cuid !== 'string') throw new Error('state_cuid must be a string');
    result.state_cuid = raw.state_cuid;
  }
  if (raw.country_cuid !== undefined) {
    if (typeof raw.country_cuid !== 'string') throw new Error('country_cuid must be a string');
    result.country_cuid = raw.country_cuid;
  }
  if (raw.pin_code !== undefined) {
    if (typeof raw.pin_code !== 'string') throw new Error('pin_code must be a string');
    result.pin_code = raw.pin_code;
  }
  if (raw.timezone !== undefined) {
    if (typeof raw.timezone !== 'string') throw new Error('timezone must be a string');
    result.timezone = raw.timezone;
  }

  if (raw.is_active !== undefined) {
    if (typeof raw.is_active !== 'boolean') {
      const err: any = new Error('is_active must be a boolean');
      err.status = 400;
      throw err;
    }
    result.is_active = raw.is_active;
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
