import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { PayrollUpload, Payroll, PayrollUploadFailure } from '$lib/types/payroll';

export const load: PageLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/payroll-uploads/${params.cuid}`);

	if (res.status === 404) {
		error(404, 'Payroll upload batch not found');
	}
	if (!res.ok) {
		error(500, 'Failed to load payroll upload');
	}

	const jsonRes = await res.json();
	const { records = [], failures = [], ...upload } = jsonRes.data;

	return {
		upload: upload as PayrollUpload,
		records: records as Payroll[],
		failures: failures as PayrollUploadFailure[]
	};
};
