import type { PageLoad } from './$types';

export interface Holiday {
	id: number;
	cuid: string;
	holiday_name: string;
	holiday_date: string | Date;
	holiday_type: 'National' | 'Regional' | 'Restricted';
}

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/holidays');
	if (!res.ok) {
		return {
			holidays: [] as Holiday[],
			error: 'Failed to fetch holidays'
		};
	}
	const json = await res.json();
	return {
		holidays: (json.data || []) as Holiday[]
	};
};
