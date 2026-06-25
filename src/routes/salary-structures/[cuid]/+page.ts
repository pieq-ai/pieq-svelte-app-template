import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { SalaryStructure } from '$lib/types/salary-structure';

export const load: PageLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/salary-structures/${params.cuid}`);

	if (res.status === 404) {
		error(404, 'Salary structure not found');
	}

	if (!res.ok) {
		error(500, 'Failed to load salary structure');
	}

	const data = await res.json();
	const structure: SalaryStructure = data.data;

	return { structure };
};
