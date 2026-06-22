import type { PageLoad } from './$types';

/**
 * Client-side load — matches the Attendance page pattern.
 * Fetches the full employee list from the same endpoint as Attendance.
 * All leave data is loaded client-side after the user selects an employee from the dropdown.
 */
export const load: PageLoad = async ({ fetch }) => {
	const employeesRes = await fetch('/api/employees/attendance-view');

	let employees: any[] = [];

	if (employeesRes.ok) {
		const json = await employeesRes.json();
		const rawEmployees = json.data || [];
		employees = rawEmployees.map((emp: any) => ({
			...emp,
			uuid: emp.cuid,
			name: `${emp.first_name} ${emp.last_name}`
		}));
	}

	return { employees };
};
