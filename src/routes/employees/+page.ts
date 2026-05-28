import type { PageLoad } from './$types';

export interface Employee {
	id: number;
	uuid: string;
	name: string;
	age: number;
}

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/employees');
	if (!res.ok) {
		return {
			employees: [] as Employee[],
			error: 'Failed to fetch employees'
		};
	}
	const json = await res.json();
	return {
		employees: (json.data || []) as Employee[]
	};
};
