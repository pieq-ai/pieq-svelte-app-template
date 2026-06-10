import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMasterData } from '$lib/server/services/master-data.service.js';
import { getDepartments } from '$lib/server/services/department.service.js';
import { getDesignations } from '$lib/server/services/designation.service.js';

// Need CompanyLocation service? Wait, do we have one?
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
			db.role.findMany({ where: { status: true } }),
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
            db.companyLocation.findMany({ where: { status: true } }),
			db.employee.findMany({ select: { cuid: true, first_name: true, last_name: true } })
		]);

		return {
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
            locations: locations.map((l: any) => ({ cuid: l.cuid, name: l.location_name })),
			employees
		};
	} catch (e) {
		console.error('Failed to load employee dependencies:', e);
		throw error(500, 'Failed to load employee dependencies');
	}
};
