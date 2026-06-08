/**
 * roles.ts
 *
 * API service functions for the Roles master module.
 * All calls go to local SvelteKit API routes via localApi.
 */
import { localApi } from './local';
import type { Role } from '$lib/types/role';

interface RoleListResponse {
  data: Role[];
  total: number;
  page: number;
  limit: number;
}

/** Fetch all roles (active + inactive). */
export async function fetchAllRoles(): Promise<Role[]> {
  const res = await localApi.get<RoleListResponse>('/api/roles?includeInactive=true');
  return res.data ?? [];
}

/** Create a new role. */
export async function createRole(name: string): Promise<Role> {
  const res = await localApi.post<{ data: Role }>('/api/roles', { name });
  return res.data;
}

/** Update an existing role. */
export async function updateRole(
  cuid: string,
  payload: { name?: string; status?: boolean }
): Promise<Role> {
  const res = await localApi.put<{ data: Role }>(`/api/roles/roleCuid=${cuid}`, payload);
  return res.data;
}

/** Soft-delete (deactivate) a role. */
export async function deleteRole(cuid: string): Promise<Role> {
  const res = await localApi.delete<{ data: Role }>(`/api/roles/roleCuid=${cuid}`);
  return res.data;
}
