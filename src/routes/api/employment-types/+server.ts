import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db.js';
import { successResponse, errorResponse, formatEmploymentType } from '$lib/server/response.js';

export const GET: RequestHandler = async () => {
	try {
		const employmentTypes = await db.employmentType.findMany({
			orderBy: { employment_name: 'asc' }
		});
		const formatted = employmentTypes.map(formatEmploymentType);
		return successResponse(formatted);
	} catch (error) {
		console.error('GET /api/employment-types failed', error);
		return errorResponse('Failed to retrieve employment types', 500);
	}
};
