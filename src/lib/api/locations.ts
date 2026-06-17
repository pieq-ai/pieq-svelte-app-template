/**
 * locations.ts
 *
 * API service functions for the Organization Locations master module.
 * All calls go to local SvelteKit API routes via localApi.
 */
import { localApi } from './local';
import type { CompanyLocation } from '$lib/types/organization_location';

interface LocationListResponse {
  data: CompanyLocation[];
  total: number;
  page: number;
  limit: number;
}

export interface Country {
  cuid: string;
  name: string;
}

export interface State {
  cuid: string;
  country_cuid: string;
  name: string;
}

export interface LocationCreatePayload {
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state_cuid: string;
  country_cuid: string;
  pin_code: string;
  timezone: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationUpdatePayload extends Partial<LocationCreatePayload> {
  status?: boolean;
}

/** Fetch all locations (active + inactive). */
export async function fetchAllLocations(): Promise<CompanyLocation[]> {
  const res = await localApi.get<LocationListResponse>(
    '/api/organization_location?includeInactive=true'
  );
  return res.data ?? [];
}

/** Fetch all countries for dropdown. */
export async function fetchCountries(): Promise<Country[]> {
  const res = await localApi.get<{ data: Country[] }>('/api/countries');
  return res.data ?? [];
}

/** Fetch all states for dropdown. */
export async function fetchStates(): Promise<State[]> {
  const res = await localApi.get<{ data: State[] }>('/api/states');
  return res.data ?? [];
}

/** Create a new location. */
export async function createLocation(payload: LocationCreatePayload): Promise<CompanyLocation> {
  const res = await localApi.post<{ data: CompanyLocation }>(
    '/api/organization_location',
    payload
  );
  return res.data;
}

/** Update an existing location. */
export async function updateLocation(
  cuid: string,
  payload: LocationUpdatePayload
): Promise<CompanyLocation> {
  const res = await localApi.put<{ data: CompanyLocation }>(
    `/api/organization_location/${cuid}`,
    payload
  );
  return res.data;
}

/** Soft-delete (deactivate) a location. */
export async function deleteLocation(cuid: string): Promise<CompanyLocation> {
  const res = await localApi.delete<{ data: CompanyLocation }>(
    `/api/organization_location/${cuid}`
  );
  return res.data;
}

/** Activate a previously deactivated location. */
export async function activateLocation(cuid: string): Promise<CompanyLocation> {
  const res = await localApi.patch<{ data: CompanyLocation }>(
    `/api/organization_location/${cuid}`
  );
  return res.data;
}

/** Create a new country. */
export async function createCountry(name: string): Promise<{ cuid: string }> {
  const res = await localApi.post<{ data: { cuid: string } }>(
    '/api/master-data/countries',
    { name }
  );
  return res.data;
}

/** Create a new state. */
export async function createState(name: string, countryCuid: string): Promise<{ cuid: string }> {
  const res = await localApi.post<{ data: { cuid: string } }>(
    '/api/master-data/states',
    { name, country_cuid: countryCuid }
  );
  return res.data;
}

