import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { PayrollUpload, Payroll, PayrollUploadFailure } from '$lib/types/payroll';

export const load: PageLoad = async ({ params, fetch }) => {
	// Load the upload batch metadata
	const uploadRes = await fetch(`/api/payroll-uploads/${params.cuid}`);

	if (uploadRes.status === 404) {
		error(404, 'Payroll upload batch not found');
	}
	if (!uploadRes.ok) {
		error(500, 'Failed to load payroll upload');
	}

	const uploadData = await uploadRes.json();
	const upload: PayrollUpload = uploadData.data;

	// Load payroll records for this upload batch
	const recordsRes = await fetch(`/api/payroll-uploads/${params.cuid}/records`);
	if (!recordsRes.ok) {
		error(500, 'Failed to load payroll records for this upload');
	}
	const recordsData = await recordsRes.json();
	const records: Payroll[] = recordsData.data ?? [];

	// Load failures for this upload batch
	const failuresRes = await fetch(`/api/payroll-uploads/${params.cuid}/failures`);
	if (!failuresRes.ok) {
		error(500, 'Failed to load failures for this upload');
	}
	const failuresData = await failuresRes.json();
	const failures: PayrollUploadFailure[] = failuresData.data ?? [];

	return { upload, records, failures };
};
