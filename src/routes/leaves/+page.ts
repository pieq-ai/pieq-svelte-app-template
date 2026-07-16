import type { PageLoad } from './$types';

/**
 * Client-side load — matches the Attendance page pattern.
 * Fetches the full employee list from the same endpoint as Attendance.
 * All leave data is loaded client-side after the user selects an employee from the dropdown.
 */
export const load: PageLoad = async ({ fetch }) => {
	const holidaysRes = await fetch('/api/holidays');

	let holidays: any[] = [];

	if (holidaysRes.ok) {
		const json = await holidaysRes.json();
		holidays = json.data || [];
	}

	return { holidays };
};

