import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db.js';

export const GET: RequestHandler = async () => {
	try {
		const employmentTypes = await db.employmentType.findMany({
			orderBy: { employment_name: 'asc' }
		});
		return json({
			success: true,
			message: 'Employment types retrieved successfully',
			data: employmentTypes
		});
	} catch (error) {
		console.error('GET /api/employment-types failed', error);
		return json({
			success: false,
			message: 'Failed to retrieve employment types'
		}, { status: 500 });
	}
};
