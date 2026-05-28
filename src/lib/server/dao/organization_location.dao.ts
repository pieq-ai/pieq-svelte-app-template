// src/lib/server/dao/organization_location.dao.ts
import { db } from '$lib/server/db.js';
import type { CompanyLocation, CompanyLocationCreateDTO, CompanyLocationUpdateDTO } from '$lib/types/organization_location';

/**
 * Create a new company location.
 * Fills in required schema fields with sensible organization defaults.
 */
export async function createLocation(data: CompanyLocationCreateDTO): Promise<CompanyLocation> {
  return db.companyLocation.create({
    data: {
      location_name: data.location_name.trim(),
      address_line1: '123 Enterprise Way',
      city: 'Default City',
      state_id: 1,
      country_id: 1,
      pin_code: '000000',
      timezone: 'UTC',
      is_active: true
    },
  }) as unknown as Promise<CompanyLocation>;
}

/**
 * Get a paginated list of active locations.
 */
export async function getLocations(page: number, limit: number): Promise<CompanyLocation[]> {
  const skip = (page - 1) * limit;
  return db.companyLocation.findMany({
    where: { is_active: true },
    orderBy: { location_id: 'asc' },
    skip,
    take: limit,
  }) as unknown as Promise<CompanyLocation[]>;
}

/**
 * Get a paginated list of ALL locations (active + inactive).
 */
export async function getAllLocations(page: number, limit: number): Promise<CompanyLocation[]> {
  const skip = (page - 1) * limit;
  return db.companyLocation.findMany({
    orderBy: { location_id: 'asc' },
    skip,
    take: limit,
  }) as unknown as Promise<CompanyLocation[]>;
}

/**
 * Count ALL locations including inactive.
 */
export async function countAllLocations(): Promise<number> {
  return db.companyLocation.count();
}

/**
 * Count active locations.
 */
export async function countLocations(): Promise<number> {
  return db.companyLocation.count({ where: { is_active: true } });
}

/**
 * Retrieve a location by its numeric ID.
 */
export async function getLocationById(locationId: number): Promise<CompanyLocation | null> {
  return db.companyLocation.findUnique({ where: { location_id: locationId } }) as unknown as Promise<CompanyLocation | null>;
}

/**
 * Update an existing location.
 */
export async function updateLocation(locationId: number, data: CompanyLocationUpdateDTO): Promise<CompanyLocation> {
  const updateData: any = {};
  if (data.location_name !== undefined) {
    updateData.location_name = data.location_name.trim();
  }
  if (data.is_active !== undefined) {
    updateData.is_active = data.is_active;
  }

  return db.companyLocation.update({
    where: { location_id: locationId },
    data: updateData,
  }) as unknown as Promise<CompanyLocation>;
}

/**
 * Soft‑delete (deactivate) a location.
 */
export async function deactivateLocation(locationId: number): Promise<CompanyLocation> {
  return db.companyLocation.update({
    where: { location_id: locationId },
    data: { is_active: false }
  }) as unknown as Promise<CompanyLocation>;
}

/**
 * Activate a deactivated location.
 */
export async function activateLocation(locationId: number): Promise<CompanyLocation> {
  return db.companyLocation.update({
    where: { location_id: locationId },
    data: { is_active: true }
  }) as unknown as Promise<CompanyLocation>;
}
