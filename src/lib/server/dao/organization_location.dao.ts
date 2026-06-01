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
      address_line1: data.address_line1 !== undefined ? data.address_line1 : '123 Enterprise Way',
      address_line2: data.address_line2,
      city: data.city !== undefined ? data.city : 'Default City',
      state_cuid: data.state_cuid !== undefined ? data.state_cuid : 'state-cuid-placeholder',
      country_cuid: data.country_cuid !== undefined ? data.country_cuid : 'country-cuid-placeholder',
      pin_code: data.pin_code !== undefined ? data.pin_code : '000000',
      timezone: data.timezone !== undefined ? data.timezone : 'UTC',
      is_active: true
    },
    select: {
      cuid: true,
      location_name: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state_cuid: true,
      country_cuid: true,
      pin_code: true,
      timezone: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
  }) as unknown as Promise<CompanyLocation>;
}

/**
 * Get a list of active locations.
 */
export async function getLocations(): Promise<CompanyLocation[]> {
  return db.companyLocation.findMany({
    where: { is_active: true },
    orderBy: { id: 'asc' },
    select: {
      cuid: true,
      location_name: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state_cuid: true,
      country_cuid: true,
      pin_code: true,
      timezone: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
  }) as unknown as Promise<CompanyLocation[]>;
}

/**
 * Get a list of ALL locations (active + inactive).
 */
export async function getAllLocations(): Promise<CompanyLocation[]> {
  return db.companyLocation.findMany({
    orderBy: { id: 'asc' },
    select: {
      cuid: true,
      location_name: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state_cuid: true,
      country_cuid: true,
      pin_code: true,
      timezone: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
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
 * Retrieve a location by its CUID.
 */
export async function getLocationByCuid(cuid: string): Promise<CompanyLocation | null> {
  return db.companyLocation.findUnique({
    where: { cuid },
    select: {
      cuid: true,
      location_name: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state_cuid: true,
      country_cuid: true,
      pin_code: true,
      timezone: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
  }) as unknown as Promise<CompanyLocation | null>;
}

/**
 * Update an existing location.
 */
export async function updateLocation(cuid: string, data: CompanyLocationUpdateDTO): Promise<CompanyLocation> {
  const updateData: any = {};
  if (data.location_name !== undefined) {
    updateData.location_name = data.location_name.trim();
  }
  if (data.address_line1 !== undefined) {
    updateData.address_line1 = data.address_line1;
  }
  if (data.address_line2 !== undefined) {
    updateData.address_line2 = data.address_line2;
  }
  if (data.city !== undefined) {
    updateData.city = data.city;
  }
  if (data.state_cuid !== undefined) {
    updateData.state_cuid = data.state_cuid;
  }
  if (data.country_cuid !== undefined) {
    updateData.country_cuid = data.country_cuid;
  }
  if (data.pin_code !== undefined) {
    updateData.pin_code = data.pin_code;
  }
  if (data.timezone !== undefined) {
    updateData.timezone = data.timezone;
  }
  if (data.is_active !== undefined) {
    updateData.is_active = data.is_active;
  }

  return db.companyLocation.update({
    where: { cuid },
    data: updateData,
    select: {
      cuid: true,
      location_name: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state_cuid: true,
      country_cuid: true,
      pin_code: true,
      timezone: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
  }) as unknown as Promise<CompanyLocation>;
}

/**
 * Soft‑delete (deactivate) a location.
 */
export async function deactivateLocation(cuid: string): Promise<CompanyLocation> {
  return db.companyLocation.update({
    where: { cuid },
    data: { is_active: false },
    select: {
      cuid: true,
      location_name: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state_cuid: true,
      country_cuid: true,
      pin_code: true,
      timezone: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
  }) as unknown as Promise<CompanyLocation>;
}

/**
 * Activate a deactivated location.
 */
export async function activateLocation(cuid: string): Promise<CompanyLocation> {
  return db.companyLocation.update({
    where: { cuid },
    data: { is_active: true },
    select: {
      cuid: true,
      location_name: true,
      address_line1: true,
      address_line2: true,
      city: true,
      state_cuid: true,
      country_cuid: true,
      pin_code: true,
      timezone: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
  }) as unknown as Promise<CompanyLocation>;
}
