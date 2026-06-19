import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [recordsRes, employeesRes, sourcesRes, holidaysRes] = await Promise.all([
		fetch('/api/attendance-records'),
		fetch('/api/employees'),
		fetch('/api/master-data/attendance-sources'),
		fetch('/api/holidays')
	]);

	let records: any[] = [];
	let employees: any[] = [];
	let sources: any[] = [];
	let holidays: any[] = [];
	let error = null;

	if (recordsRes.ok) {
		const json = await recordsRes.json();
		records = json.data || [];
	} else {
		error = 'Failed to fetch attendance records';
	}

	if (employeesRes.ok) {
		const json = await employeesRes.json();
		employees = json.data || [];
	} else {
		error = 'Failed to fetch employees';
	}

	if (sourcesRes.ok) {
		const json = await sourcesRes.json();
		sources = json.data || [];
	} else {
		error = 'Failed to fetch attendance sources';
	}

	if (holidaysRes.ok) {
		const json = await holidaysRes.json();
		holidays = json.data || [];
	} else {
		error = 'Failed to fetch holidays';
	}

	return {
		records,
		employees,
		sources,
		holidays,
		error
	};
};
