import { requirePermission } from '$lib/server/authz/guards';
import { json } from '@sveltejs/kit';
import { getAll } from '$lib/server/providers/employee.provider.js';

/** Returns the active employee list for use in the salary structure form dropdown. */
export async function GET() {
	
		requirePermission(locals.user, 'employee:view');
const employees = await getAll();
	return json({ data: employees });
}
