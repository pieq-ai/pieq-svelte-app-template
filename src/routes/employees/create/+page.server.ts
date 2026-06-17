import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMasterData } from '$lib/server/services/master-data.service.js';
import { getDepartments } from '$lib/server/services/department.service.js';
import { getDesignations } from '$lib/server/services/designation.service.js';

import { listRoles } from '$lib/server/services/role.service.js';
import { listLocations } from '$lib/server/services/organization_location.service.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	try {
		const [
			departments,
			designations,
			roles,
			bloodGroups,
			nationalities,
			employmentTypes,
			payGrades,
			relationTypes,
			documentTypes,
			skills,
			languages,
			countries,
			states,
            locations,
			employees
		] = await Promise.all([
			getDepartments(),
			getDesignations(),
			listRoles(),
			getMasterData('blood-groups'),
			getMasterData('nationalities'),
			getMasterData('employment-types'),
			getMasterData('pay-grades'),
			getMasterData('relation-types'),
			getMasterData('document-types'),
			getMasterData('skills'),
			getMasterData('languages'),
			getMasterData('countries'),
			getMasterData('states'),
            listLocations(),
			db.employee.findMany({ select: { cuid: true, first_name: true, last_name: true } })
		]);

		return {
			departments,
			designations,
			roles: roles.data,
			bloodGroups,
			nationalities,
			employmentTypes,
			payGrades,
			relationTypes,
			documentTypes,
			skills,
			languages,
			countries,
			states,
            locations: locations.data,
			employees
		};
	} catch (e) {
		console.error('Failed to load employee dependencies:', e);
		throw error(500, 'Failed to load employee dependencies');
	}
};
