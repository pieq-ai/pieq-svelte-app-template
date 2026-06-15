import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const today = new Date();
	const y = today.getFullYear();
	const m = String(today.getMonth() + 1).padStart(2, '0');
	const d = String(today.getDate()).padStart(2, '0');
	const todayStr = `${y}-${m}-${d}`;

	const [employeesRes, sourcesRes, holidaysRes] = await Promise.all([
		fetch('/api/employees'),
		fetch('/api/master-data/attendance-sources'),
		fetch('/api/holidays')
	]);

	let employees: any[] = [];
	let sources: any[] = [];
	let holidays: any[] = [];

	if (employeesRes.ok) {
		const json = await employeesRes.json();
		employees = json.data || [];
	}
	if (sourcesRes.ok) {
		const json = await sourcesRes.json();
		sources = json.data || [];
	}
	if (holidaysRes.ok) {
		const json = await holidaysRes.json();
		holidays = json.data || [];
	}

	return {
		employees,
		sources,
		holidays,
		todayStr
	};
};
