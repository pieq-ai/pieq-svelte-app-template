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
    'name',
    'address_line1',
    'address_line2',
    'city',
    'state_cuid',
    'country_cuid',
    'pin_code',
    'timezone',
    'latitude',
    'longitude',
    'created_by',
    'updated_by'
  ];
  rejectUnknownKeys(raw, allowedKeys);

  // name
  if (raw.name === undefined || raw.name === null) {
    const err: any = new Error('Company Location name is required');
    err.status = 400;
    throw err;
  }
  if (typeof raw.name !== 'string') {
    const err: any = new Error('Company Location name must be a string');
    err.status = 400;
    throw err;
  }
  const name = raw.name.trim();
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
  if (name.length > 150) {
    const err: any = new Error('Company Location name cannot exceed 150 characters');
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

  // address_line1
  if (raw.address_line1 === undefined || raw.address_line1 === null) {
    const err: any = new Error('Address Line 1 is required');
    err.status = 400;
    throw err;
  }
  if (typeof raw.address_line1 !== 'string') {
    const err: any = new Error('Address Line 1 must be a string');
    err.status = 400;
    throw err;
  }
  const address1 = raw.address_line1.trim();
  if (address1.length === 0) {
    const err: any = new Error('Address Line 1 is required');
    err.status = 400;
    throw err;
  }
  if (address1.length > 255) {
    const err: any = new Error('Address Line 1 cannot exceed 255 characters');
    err.status = 400;
    throw err;
  }

  // address_line2
  let address2: string | null = null;
  if (raw.address_line2 !== undefined && raw.address_line2 !== null) {
    if (typeof raw.address_line2 !== 'string') {
      const err: any = new Error('Address Line 2 must be a string');
      err.status = 400;
      throw err;
    }
    address2 = raw.address_line2.trim();
    if (address2.length > 255) {
      const err: any = new Error('Address Line 2 cannot exceed 255 characters');
      err.status = 400;
      throw err;
    }
  }

  // city
  if (raw.city === undefined || raw.city === null) {
    const err: any = new Error('City is required');
    err.status = 400;
    throw err;
  }
  if (typeof raw.city !== 'string') {
    const err: any = new Error('City must be a string');
    err.status = 400;
    throw err;
  }
  const city = raw.city.trim();
  if (city.length === 0) {
    const err: any = new Error('City is required');
    err.status = 400;
    throw err;
  }
  if (city.length < 2) {
    const err: any = new Error('City must be at least 2 characters');
    err.status = 400;
    throw err;
  }
  if (city.length > 100) {
    const err: any = new Error('City cannot exceed 100 characters');
    err.status = 400;
    throw err;
  }
  if (!/^[a-zA-Z\s.-]+$/.test(city)) {
    const err: any = new Error('City can contain only letters, spaces, hyphens, and periods');
    err.status = 400;
    throw err;
  }

  // state_cuid
  if (raw.state_cuid === undefined || raw.state_cuid === null) {
    const err: any = new Error('State is required');
    err.status = 400;
    throw err;
  }
  if (typeof raw.state_cuid !== 'string') {
    const err: any = new Error('State CUID must be a string');
    err.status = 400;
    throw err;
  }
  const stateCuid = raw.state_cuid.trim();
  if (stateCuid.length === 0) {
    const err: any = new Error('State is required');
    err.status = 400;
    throw err;
  }
  if (stateCuid.length > 50) {
    const err: any = new Error('State CUID cannot exceed 50 characters');
    err.status = 400;
    throw err;
  }

  // country_cuid
  if (raw.country_cuid === undefined || raw.country_cuid === null) {
    const err: any = new Error('Country is required');
    err.status = 400;
    throw err;
  }
  if (typeof raw.country_cuid !== 'string') {
    const err: any = new Error('Country CUID must be a string');
    err.status = 400;
    throw err;
  }
  const countryCuid = raw.country_cuid.trim();
  if (countryCuid.length === 0) {
    const err: any = new Error('Country is required');
    err.status = 400;
    throw err;
  }
  if (countryCuid.length > 50) {
    const err: any = new Error('Country CUID cannot exceed 50 characters');
    err.status = 400;
    throw err;
  }

  // pin_code
  if (raw.pin_code === undefined || raw.pin_code === null) {
    const err: any = new Error('Pin Code is required');
    err.status = 400;
    throw err;
  }
  if (typeof raw.pin_code !== 'string') {
    const err: any = new Error('Pin Code must be a string');
    err.status = 400;
    throw err;
  }
  const pinCode = raw.pin_code.trim();
  if (pinCode.length === 0) {
    const err: any = new Error('Pin Code is required');
    err.status = 400;
    throw err;
  }
  if (!/^\d+$/.test(pinCode)) {
    const err: any = new Error('Pin Code must contain numeric values only');
    err.status = 400;
    throw err;
  }
  if (pinCode.length > 10) {
    const err: any = new Error('Pin Code cannot exceed 10 characters');
    err.status = 400;
    throw err;
  }

  // timezone
  if (raw.timezone === undefined || raw.timezone === null) {
    const err: any = new Error('Timezone is required');
    err.status = 400;
    throw err;
  }
  if (typeof raw.timezone !== 'string') {
    const err: any = new Error('Timezone must be a string');
    err.status = 400;
    throw err;
  }
  const timezone = raw.timezone.trim();
  if (timezone.length === 0) {
    const err: any = new Error('Timezone is required');
    err.status = 400;
    throw err;
  }
  if (timezone.length > 60) {
    const err: any = new Error('Timezone cannot exceed 60 characters');
    err.status = 400;
    throw err;
  }

  // latitude
  let latitude: number | null = null;
  if (raw.latitude !== undefined && raw.latitude !== null) {
    const parsedLat = Number(raw.latitude);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      const err: any = new Error('Latitude must be a valid number between -90 and 90');
      err.status = 400;
      throw err;
    }
    latitude = parsedLat;
  }

  // longitude
  let longitude: number | null = null;
  if (raw.longitude !== undefined && raw.longitude !== null) {
    const parsedLon = Number(raw.longitude);
    if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      const err: any = new Error('Longitude must be a valid number between -180 and 180');
      err.status = 400;
      throw err;
    }
    longitude = parsedLon;
  }

  return {
    name: name,
    address_line1: address1,
    address_line2: address2,
    city: city,
    state_cuid: stateCuid,
    country_cuid: countryCuid,
    pin_code: pinCode,
    timezone: timezone,
    latitude: latitude,
    longitude: longitude,
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
    'name',
    'address_line1',
    'address_line2',
    'city',
    'state_cuid',
    'country_cuid',
    'pin_code',
    'timezone',
    'status',
    'latitude',
    'longitude',
    'created_by',
    'updated_by'
  ];
  rejectUnknownKeys(raw, allowedKeys);

  const result: CompanyLocationUpdateDTO = {};

  if (raw.name !== undefined) {
    if (raw.name === null) {
      const err: any = new Error('Company Location name must be a string');
      err.status = 400;
      throw err;
    }

    if (typeof raw.name !== 'string') {
      const err: any = new Error('Company Location name must be a string');
      err.status = 400;
      throw err;
    }

    const name = raw.name.trim();

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

    if (name.length > 150) {
      const err: any = new Error('Company Location name cannot exceed 150 characters');
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

    result.name = name;
  }

  if (raw.address_line1 !== undefined) {
    if (typeof raw.address_line1 !== 'string') {
      const err: any = new Error('Address Line 1 must be a string');
      err.status = 400;
      throw err;
    }
    const val = raw.address_line1.trim();
    if (val.length === 0) {
      const err: any = new Error('Address Line 1 is required');
      err.status = 400;
      throw err;
    }
    if (val.length > 255) {
      const err: any = new Error('Address Line 1 cannot exceed 255 characters');
      err.status = 400;
      throw err;
    }
    result.address_line1 = val;
  }

  if (raw.address_line2 !== undefined) {
    if (raw.address_line2 === null) {
      result.address_line2 = null;
    } else {
      if (typeof raw.address_line2 !== 'string') {
        const err: any = new Error('Address Line 2 must be a string');
        err.status = 400;
        throw err;
      }
      const val = raw.address_line2.trim();
      if (val.length > 255) {
        const err: any = new Error('Address Line 2 cannot exceed 255 characters');
        err.status = 400;
        throw err;
      }
      result.address_line2 = val;
    }
  }

  if (raw.city !== undefined) {
    if (typeof raw.city !== 'string') {
      const err: any = new Error('City must be a string');
      err.status = 400;
      throw err;
    }
    const val = raw.city.trim();
    if (val.length === 0) {
      const err: any = new Error('City is required');
      err.status = 400;
      throw err;
    }
    if (val.length < 2) {
      const err: any = new Error('City must be at least 2 characters');
      err.status = 400;
      throw err;
    }
    if (val.length > 100) {
      const err: any = new Error('City cannot exceed 100 characters');
      err.status = 400;
      throw err;
    }
    if (!/^[a-zA-Z\s.-]+$/.test(val)) {
      const err: any = new Error('City can contain only letters, spaces, hyphens, and periods');
      err.status = 400;
      throw err;
    }
    result.city = val;
  }

  if (raw.state_cuid !== undefined) {
    if (typeof raw.state_cuid !== 'string') {
      const err: any = new Error('State CUID must be a string');
      err.status = 400;
      throw err;
    }
    const val = raw.state_cuid.trim();
    if (val.length === 0) {
      const err: any = new Error('State is required');
      err.status = 400;
      throw err;
    }
    if (val.length > 50) {
      const err: any = new Error('State CUID cannot exceed 50 characters');
      err.status = 400;
      throw err;
    }
    result.state_cuid = val;
  }

  if (raw.country_cuid !== undefined) {
    if (typeof raw.country_cuid !== 'string') {
      const err: any = new Error('Country CUID must be a string');
      err.status = 400;
      throw err;
    }
    const val = raw.country_cuid.trim();
    if (val.length === 0) {
      const err: any = new Error('Country is required');
      err.status = 400;
      throw err;
    }
    if (val.length > 50) {
      const err: any = new Error('Country CUID cannot exceed 50 characters');
      err.status = 400;
      throw err;
    }
    result.country_cuid = val;
  }

  if (raw.pin_code !== undefined) {
    if (raw.pin_code === null || typeof raw.pin_code !== 'string') {
      const err: any = new Error('Pin Code must be a string');
      err.status = 400;
      throw err;
    }
    const trimmedPin = raw.pin_code.trim();
    if (!/^\d+$/.test(trimmedPin)) {
      const err: any = new Error('Pin Code must contain numeric values only');
      err.status = 400;
      throw err;
    }
    if (trimmedPin.length > 10) {
      const err: any = new Error('Pin Code cannot exceed 10 characters');
      err.status = 400;
      throw err;
    }
    result.pin_code = trimmedPin;
  }

  if (raw.timezone !== undefined) {
    if (typeof raw.timezone !== 'string') {
      const err: any = new Error('Timezone must be a string');
      err.status = 400;
      throw err;
    }
    const val = raw.timezone.trim();
    if (val.length === 0) {
      const err: any = new Error('Timezone is required');
      err.status = 400;
      throw err;
    }
    if (val.length > 60) {
      const err: any = new Error('Timezone cannot exceed 60 characters');
      err.status = 400;
      throw err;
    }
    result.timezone = val;
  }

  if (raw.latitude !== undefined) {
    if (raw.latitude === null) {
      result.latitude = null;
    } else {
      const parsedLat = Number(raw.latitude);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        const err: any = new Error('Latitude must be a valid number between -90 and 90');
        err.status = 400;
        throw err;
      }
      result.latitude = parsedLat;
    }
  }

  if (raw.longitude !== undefined) {
    if (raw.longitude === null) {
      result.longitude = null;
    } else {
      const parsedLon = Number(raw.longitude);
      if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
        const err: any = new Error('Longitude must be a valid number between -180 and 180');
        err.status = 400;
        throw err;
      }
      result.longitude = parsedLon;
    }
  }

  if (raw.status !== undefined) {
    if (typeof raw.status !== 'boolean') {
      const err: any = new Error('status must be a boolean');
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
