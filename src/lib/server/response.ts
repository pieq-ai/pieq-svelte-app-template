import { json } from '@sveltejs/kit';

export interface HolidayInput {
	cuid: string;
	holiday_name: string;
	holiday_date: Date | string;
	holiday_type: string;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface HolidayDTO {
	cuid: string;
	holiday_name: string;
	holiday_date: string;
	holiday_type: 'National' | 'Regional' | 'Restricted';
	created_by: string | null;
	updated_by: string | null;
}

export function formatHoliday(holiday: HolidayInput): HolidayDTO {
	return {
		cuid: holiday.cuid,
		holiday_name: holiday.holiday_name,
		holiday_date: holiday.holiday_date instanceof Date 
			? holiday.holiday_date.toISOString().split('T')[0]
			: new Date(holiday.holiday_date).toISOString().split('T')[0],
		holiday_type: holiday.holiday_type as 'National' | 'Regional' | 'Restricted',
		created_by: holiday.created_by || null,
		updated_by: holiday.updated_by || null
	};
}

export interface LeaveTypeInput {
	cuid: string;
	leave_name: string;
	leave_code: string;
	description?: string | null;
	is_paid: boolean;
	requires_approval: boolean;
	status: boolean;
	updated_at?: Date | string;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface LeaveTypeDTO {
	cuid: string;
	leave_name: string;
	leave_code: string;
	description: string | null;
	is_paid: boolean;
	requires_approval: boolean;
	status: boolean;
	updated_at: string;
	created_by: string | null;
	updated_by: string | null;
}

export function formatLeaveType(type: LeaveTypeInput): LeaveTypeDTO {
	return {
		cuid: type.cuid,
		leave_name: type.leave_name,
		leave_code: type.leave_code,
		description: type.description || null,
		is_paid: type.is_paid,
		requires_approval: type.requires_approval,
		status: type.status,
		updated_at: type.updated_at instanceof Date 
			? type.updated_at.toISOString() 
			: type.updated_at ? new Date(type.updated_at).toISOString() : new Date().toISOString(),
		created_by: type.created_by || null,
		updated_by: type.updated_by || null
	};
}

export interface LeavePolicyInput {
	cuid: string;
	leave_type_cuid: string;
	annual_limit: number;
	max_per_month?: number | null;
	carry_forward_allowed: boolean;
	max_carry_forward_days?: number | null;
	document_required: boolean;
	document_required_after_days?: number | null;
	min_service_days: number;
	allow_half_day: boolean;
	gender_specific: boolean;
	applicable_gender?: string | null;
	status: boolean;
	employment_type_cuids?: string[];
	updated_at?: Date | string;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface LeavePolicyDTO {
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
	updated_at: string;
	created_by: string | null;
	updated_by: string | null;
}

export function formatLeavePolicy(policy: LeavePolicyInput): LeavePolicyDTO {
	return {
		cuid: policy.cuid,
		leave_type_cuid: policy.leave_type_cuid,
		annual_limit: policy.annual_limit,
		max_per_month: policy.max_per_month || null,
		carry_forward_allowed: policy.carry_forward_allowed,
		max_carry_forward_days: policy.max_carry_forward_days || null,
		document_required: policy.document_required,
		document_required_after_days: policy.document_required_after_days !== undefined && policy.document_required_after_days !== null ? Number(policy.document_required_after_days) : null,
		min_service_days: policy.min_service_days,
		allow_half_day: policy.allow_half_day,
		gender_specific: policy.gender_specific,
		applicable_gender: (policy.applicable_gender || null) as 'Male' | 'Female' | 'Others' | null,
		status: policy.status,
		employment_type_cuids: policy.employment_type_cuids || [],
		updated_at: policy.updated_at instanceof Date 
			? policy.updated_at.toISOString() 
			: policy.updated_at ? new Date(policy.updated_at).toISOString() : new Date().toISOString(),
		created_by: policy.created_by || null,
		updated_by: policy.updated_by || null
	};
}

export interface EmploymentTypeInput {
	id: number;
	cuid: string;
	employment_name: string;
	status: boolean;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface EmploymentTypeDTO {
	id: number;
	cuid: string;
	employment_name: string;
	status: boolean;
	created_by: string | null;
	updated_by: string | null;
}

export function formatEmploymentType(et: EmploymentTypeInput): EmploymentTypeDTO {
	return {
		id: et.id,
		cuid: et.cuid,
		employment_name: et.employment_name,
		status: et.status,
		created_by: et.created_by || null,
		updated_by: et.updated_by || null
	};
}

export function successResponse(data: unknown, status = 200) {
	return json({ data }, { status });
}

export function errorResponse(message: string, status = 400, field?: string) {
	return json({
		data: {
			error: message,
			...(field ? { field } : {})
		}
	}, { status });
}

export function createSuccessResponse(entityName: string, cuid: string) {
	return successResponse({
		message: `${entityName} created successfully`,
		cuid
	}, 201);
}

export function updateSuccessResponse(entityName: string, cuid: string, customMessage?: string) {
	return successResponse({
		message: customMessage || `${entityName} updated successfully`,
		cuid
	}, 200);
}

export function deleteSuccessResponse(entityName: string, cuid: string, customMessage?: string) {
	return successResponse({
		message: customMessage || `${entityName} deleted successfully`,
		cuid
	}, 200);
}
