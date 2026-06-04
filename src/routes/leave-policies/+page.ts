import type { PageLoad } from './$types';

export interface LeavePolicy {
	id: number;
	cuid: string;
	leave_type_cuid: string;
	annual_limit: number;
	max_per_month: number | null;
	carry_forward_allowed: boolean;
	max_carry_forward_days: number | null;
	document_required: boolean;
	document_required_after_days: number | null;
	min_service_days: number;
	allow_half_day: boolean;
	gender_specific: boolean;
	applicable_gender: 'Male' | 'Female' | 'Others' | null;
	status: boolean;
	employment_type_cuids: string[];
}

export interface LeaveType {
	id: number;
	cuid: string;
	leave_name: string;
	leave_code: string;
	description: string | null;
	is_paid: boolean;
	requires_approval: boolean;
	status: boolean;
}

export interface EmploymentType {
	id: number;
	cuid: string;
	employment_name: string;
	status: boolean;
}

export const load: PageLoad = async ({ fetch }) => {
	const [policiesRes, typesRes, empTypesRes] = await Promise.all([
		fetch('/api/leave/policies'),
		fetch('/api/leave/types'),
		fetch('/api/employment-types')
	]);

	let policies: LeavePolicy[] = [];
	let leaveTypes: LeaveType[] = [];
	let employmentTypes: EmploymentType[] = [];
	let error = null;

	if (policiesRes.ok) {
		const json = await policiesRes.json();
		policies = (json.data || []) as LeavePolicy[];
	} else {
		error = 'Failed to fetch leave policies';
	}

	if (typesRes.ok) {
		const json = await typesRes.json();
		leaveTypes = (json.data || []) as LeaveType[];
	} else {
		error = 'Failed to fetch leave types';
	}

	if (empTypesRes.ok) {
		const json = await empTypesRes.json();
		employmentTypes = (json.data || []) as EmploymentType[];
	} else {
		error = 'Failed to fetch employment types';
	}

	return {
		policies,
		leaveTypes,
		employmentTypes,
		error
	};
};
