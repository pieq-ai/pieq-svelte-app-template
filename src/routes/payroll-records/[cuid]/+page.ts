import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { PayrollOrFailure } from '$lib/types/payroll';

export const load: PageLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/payrolls/${params.cuid}`);

	if (res.status === 404) {
		error(404, 'Payroll record not found');
	}

	if (!res.ok) {
		error(500, 'Failed to load payroll record');
	}

	const data = await res.json();
	const payroll: PayrollOrFailure = data.data;

	return { payroll };
};
