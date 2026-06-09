import { json } from '@sveltejs/kit';
import { MOCK_EMPLOYEES } from '$lib/server/providers/employee.provider.js';

/** Returns the mock employee list for use in the salary structure form dropdown. */
export async function GET() {
	return json({ data: MOCK_EMPLOYEES });
}
