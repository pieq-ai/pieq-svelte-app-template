import * as roleService from '$lib/server/services/role.service.js';
import { mapRole } from '$lib/server/response.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await roleService.listAllRoles();
	const roles = (result.data ?? []).map(mapRole);
	return { roles };
};
