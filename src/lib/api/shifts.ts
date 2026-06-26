/**
 * shifts.ts
 *
 * API service functions for the Shifts master module.
 * All calls go to local SvelteKit API routes via localApi.
 */
import { localApi } from './local';
import type { Shift } from '$lib/types/shift';

interface ShiftListResponse {
  data: Shift[];
  total: number;
  page: number;
  limit: number;
}

export interface ShiftCreatePayload {
  name: string;
  start_time: string;
  end_time: string;
  minimum_work_hours: number;
}

export interface ShiftUpdatePayload {
  name?: string;
  start_time?: string;
  end_time?: string;
  minimum_work_hours?: number;
  status?: boolean;
}

/** Fetch all shifts (active + inactive). */
export async function fetchAllShifts(): Promise<Shift[]> {
  const res = await localApi.get<ShiftListResponse>('/api/shifts?includeInactive=true');
  return res.data ?? [];
}

/** Create a new shift. */
export async function createShift(payload: ShiftCreatePayload): Promise<Shift> {
  const res = await localApi.post<{ data: Shift }>('/api/shifts', payload);
  return res.data;
}

/** Update an existing shift. */
export async function updateShift(
  cuid: string,
  payload: ShiftUpdatePayload
): Promise<Shift> {
  const res = await localApi.put<{ data: Shift }>(`/api/shifts/${cuid}`, payload);
  return res.data;
}

/** Soft-delete (deactivate) a shift. */
export async function deleteShift(cuid: string): Promise<Shift> {
  const res = await localApi.delete<{ data: Shift }>(`/api/shifts/${cuid}`);
  return res.data;
}

/** Activate a previously deactivated shift. */
export async function activateShift(cuid: string): Promise<Shift> {
  const res = await localApi.patch<{ data: Shift }>(`/api/shifts/${cuid}`);
  return res.data;
}
