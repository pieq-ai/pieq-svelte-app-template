// src/lib/api/shift-assignments.ts
import { localApi } from './local';
import type { ShiftAssignment } from '$lib/types/shift-assignment';

export interface ShiftAssignmentCreatePayload {
  employee_cuid: string;
  shift_cuid: string;
  effective_from: string;
  effective_to?: string | null;
  status?: boolean;
}

export interface ShiftAssignmentUpdatePayload {
  employee_cuid?: string;
  shift_cuid?: string;
  effective_from?: string;
  effective_to?: string | null;
  status?: boolean;
}

/** Fetch all shift assignments of subordinate employees. */
export async function fetchShiftAssignments(): Promise<ShiftAssignment[]> {
  const res = await localApi.get<{ data: ShiftAssignment[] }>('/api/shift-assignments');
  return res.data ?? [];
}

/** Create a new shift assignment. */
export async function createShiftAssignment(payload: ShiftAssignmentCreatePayload): Promise<ShiftAssignment> {
  const res = await localApi.post<{ data: ShiftAssignment }>('/api/shift-assignments', payload);
  return res.data;
}

/** Update an existing shift assignment. */
export async function updateShiftAssignment(
  cuid: string,
  payload: ShiftAssignmentUpdatePayload
): Promise<ShiftAssignment> {
  const res = await localApi.put<{ data: ShiftAssignment }>(`/api/shift-assignments/${cuid}`, payload);
  return res.data;
}

/** Delete a shift assignment. */
export async function deleteShiftAssignment(cuid: string): Promise<void> {
  await localApi.delete<void>(`/api/shift-assignments/${cuid}`);
}
