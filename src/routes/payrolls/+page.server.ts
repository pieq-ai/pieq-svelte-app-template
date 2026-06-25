import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPayrollUploads } from '$lib/server/services/payroll-upload.service.js';

export const load: PageServerLoad = async () => {
	try {
		const uploads = await getPayrollUploads();
		return { uploads };
	} catch (e) {
		console.error('Failed to load payroll uploads:', e);
		throw error(500, 'Failed to load payroll uploads');
	}
};
