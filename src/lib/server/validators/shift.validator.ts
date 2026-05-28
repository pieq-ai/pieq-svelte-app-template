// src/lib/server/validators/shift.validator.ts

/**
 * Validate pagination query parameters.
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
 * Validate payload for creating a shift.
 */
export function validateCreatePayload(payload: any) {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Shift name is required');
    err.status = 400;
    throw err;
  }

  if (payload.shift_name === undefined || payload.shift_name === null) {
    const err: any = new Error('Shift name is required');
    err.status = 400;
    throw err;
  }

  if (typeof payload.shift_name !== 'string') {
    const err: any = new Error('Shift name must be a string');
    err.status = 400;
    throw err;
  }

  const shiftName = payload.shift_name.trim();

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
    start_time: payload.start_time,
    end_time: payload.end_time,
    minimum_work_hours: payload.minimum_work_hours
  };
}

/**
 * Validate payload for updating a shift.
 */
export function validateUpdatePayload(payload: any) {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length === 0) {
    const err: any = new Error('Shift name is required');
    err.status = 400;
    throw err;
  }

  const result: {
    shift_name?: string;
    start_time?: any;
    end_time?: any;
    minimum_work_hours?: any;
    status?: boolean;
  } = {};

  if (payload.shift_name !== undefined) {
    if (payload.shift_name === null) {
      const err: any = new Error('Shift name must be a string');
      err.status = 400;
      throw err;
    }

    if (typeof payload.shift_name !== 'string') {
      const err: any = new Error('Shift name must be a string');
      err.status = 400;
      throw err;
    }

    const shiftName = payload.shift_name.trim();

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

  if (payload.start_time !== undefined) {
    result.start_time = payload.start_time;
  }
  if (payload.end_time !== undefined) {
    result.end_time = payload.end_time;
  }
  if (payload.minimum_work_hours !== undefined) {
    result.minimum_work_hours = payload.minimum_work_hours;
  }
  if (payload.status !== undefined) {
    if (typeof payload.status !== 'boolean') {
      const err: any = new Error('Status must be a boolean');
      err.status = 400;
      throw err;
    }
    result.status = payload.status;
  }

  if (Object.keys(result).length === 0) {
    const err: any = new Error('At least one valid field must be provided for update');
    err.status = 400;
    throw err;
  }

  return result;
}
