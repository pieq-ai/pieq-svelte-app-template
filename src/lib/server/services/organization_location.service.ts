// src/lib/server/services/organization_location.service.ts
import * as locationDao from '$lib/server/dao/organization_location.dao.js';
import { validateCreatePayload, validateUpdatePayload, validatePaginationParams } from '$lib/server/validators/organization_location.validator.js';

/** List only active locations with pagination. */
export async function listLocations(query: Record<string, any>) {
  const { page, limit } = validatePaginationParams(query);
  const total = await locationDao.countLocations();
  const data = await locationDao.getLocations(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** List ALL locations (active + inactive) with pagination. */
export async function listAllLocations(query: Record<string, any>) {
  const { page, limit } = validatePaginationParams(query);
  const total = await locationDao.countAllLocations();
  const data = await locationDao.getAllLocations(page, limit);
  return { data, pagination: { page, limit, total } };
}

/** Create a new location after validation and duplicate check. */
export async function createLocation(payload: any) {
  const valid = validateCreatePayload(payload);
  
  // Ensure unique active name
  const existing = await locationDao.getLocations(1, 1000);
  if (existing.some((loc) => loc.location_name.toLowerCase() === valid.location_name.toLowerCase())) {
    const err: any = new Error('Company Location name already exists');
    err.status = 409;
    throw err;
  }
  
  return locationDao.createLocation(valid);
}

/** Update an existing location. */
export async function updateLocation(id: number, payload: any) {
  const valid = validateUpdatePayload(payload);
  
  const location = await locationDao.getLocationById(id);
  if (!location) {
    const err: any = new Error('Company Location not found');
    err.status = 404;
    throw err;
  }
  
  // Duplicate name check if name provided
  if (valid.location_name) {
    const existing = await locationDao.getLocations(1, 1000);
    if (existing.some((loc) => loc.location_name.toLowerCase() === valid.location_name.toLowerCase() && loc.location_id !== id)) {
      const err: any = new Error('Company Location name already exists');
      err.status = 409;
      throw err;
    }
  }
  
  return locationDao.updateLocation(id, valid);
}

/** Soft delete / deactivate a location. */
export async function deleteLocation(id: number) {
  const location = await locationDao.getLocationById(id);
  if (!location) {
    const err: any = new Error('Company Location not found');
    err.status = 404;
    throw err;
  }
  
  return locationDao.deactivateLocation(id);
}

/** Activate an inactive location. */
export async function activateLocation(id: number) {
  const location = await locationDao.getLocationById(id);
  if (!location) {
    const err: any = new Error('Company Location not found');
    err.status = 404;
    throw err;
  }
  
  return locationDao.activateLocation(id);
}
