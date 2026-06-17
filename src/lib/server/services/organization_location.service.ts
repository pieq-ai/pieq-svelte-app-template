// src/lib/server/services/organization_location.service.ts
import type { CompanyLocation } from '$lib/types/organization_location';
import * as locationDao from '$lib/server/dao/organization_location.dao.js';
import { validateCreatePayload, validateUpdatePayload } from '$lib/server/validators/organization_location.validator.js';

/** List only active locations. */
export async function listLocations(_query?: Record<string, unknown>): Promise<{ data: CompanyLocation[] }> {
  const data = await locationDao.getLocations();
  return { data };
}

/** List ALL locations (active + inactive). */
export async function listAllLocations(_query?: Record<string, unknown>): Promise<{ data: CompanyLocation[] }> {
  const data = await locationDao.getAllLocations();
  return { data };
}

/** Create a new location after validation and duplicate check. */
export async function createLocation(payload: unknown): Promise<CompanyLocation> {
  const valid = validateCreatePayload(payload);
  
  // Ensure unique active name
  const existing = await locationDao.getLocations();
  if (existing.some((loc) => loc.location_name.toLowerCase() === valid.location_name.toLowerCase())) {
    const err: any = new Error('Company Location name already exists');
    err.status = 409;
    throw err;
  }
  
  return locationDao.createLocation(valid);
}

/** Update an existing location. */
export async function updateLocation(cuid: string, payload: unknown): Promise<CompanyLocation> {
  const valid = validateUpdatePayload(payload);
  
  const location = await locationDao.getLocationByCuid(cuid);
  if (!location) {
    const err: any = new Error('Company Location not found');
    err.status = 404;
    throw err;
  }
  
  // Duplicate name check if name provided
  if (valid.location_name) {
    const nameToCheck = valid.location_name.toLowerCase();
    const existing = await locationDao.getLocations();
    if (existing.some((loc) => loc.location_name.toLowerCase() === nameToCheck && loc.cuid !== cuid)) {
      const err: any = new Error('Company Location name already exists');
      err.status = 409;
      throw err;
    }
  }
  
  return locationDao.updateLocation(cuid, valid);
}

/** Soft delete / deactivate a location. */
export async function deleteLocation(cuid: string): Promise<CompanyLocation> {
  const location = await locationDao.getLocationByCuid(cuid);
  if (!location) {
    const err: any = new Error('Company Location not found');
    err.status = 404;
    throw err;
  }
  
  return locationDao.deactivateLocation(cuid);
}

/** Activate an inactive location. */
export async function activateLocation(cuid: string): Promise<CompanyLocation> {
  const location = await locationDao.getLocationByCuid(cuid);
  if (!location) {
    const err: any = new Error('Company Location not found');
    err.status = 404;
    throw err;
  }
  
  return locationDao.activateLocation(cuid);
}
