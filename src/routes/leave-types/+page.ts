import type { PageLoad } from './$types';

export interface LeaveType {
	id: number;
	cuid: string;
	name: string;
	code: string;
	description: string | null;
	is_paid: boolean;
	requires_approval: boolean;
	status: boolean;
}

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/leave/types');
	if (!res.ok) {
		return {
			leaveTypes: [] as LeaveType[],
			error: 'Failed to fetch leave types'
		};
	}
	const json = await res.json();
	return {
		leaveTypes: (json.data || []) as LeaveType[]
	};
};
