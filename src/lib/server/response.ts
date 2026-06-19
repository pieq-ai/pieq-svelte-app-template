import { json } from '@sveltejs/kit';

export interface HolidayInput {
	cuid: string;
	holiday_name: string;
	holiday_date: Date | string;
	holiday_type: string;
}

export interface HolidayDTO {
	cuid: string;
	holiday_name: string;
	holiday_date: string;
	holiday_type: 'National' | 'Regional' | 'Restricted';
}

export function formatHoliday(holiday: HolidayInput): HolidayDTO {
	return {
		cuid: holiday.cuid,
		holiday_name: holiday.holiday_name,
		holiday_date: holiday.holiday_date instanceof Date 
			? holiday.holiday_date.toISOString().split('T')[0]
			: new Date(holiday.holiday_date).toISOString().split('T')[0],
		holiday_type: holiday.holiday_type as 'National' | 'Regional' | 'Restricted'
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
}

export interface LeaveTypeDTO {
	cuid: string;
	leave_name: string;
	leave_code: string;
	description: string | null;
	is_paid: boolean;
	requires_approval: boolean;
	status: boolean;
}

export function formatLeaveType(type: LeaveTypeInput): LeaveTypeDTO {
	return {
		cuid: type.cuid,
		leave_name: type.leave_name,
		leave_code: type.leave_code,
		description: type.description || null,
		is_paid: type.is_paid,
		requires_approval: type.requires_approval,
		status: type.status
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
		employment_type_cuids: policy.employment_type_cuids || []
	};
}

export interface EmploymentTypeInput {
	id: bigint;
	cuid: string;
	employment_name: string;
	status: boolean;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface EmploymentTypeDTO {
	id: bigint;
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


export function sendList(data: any[]) {
  return json({ data });
}

export function sendSingle(data: any) {
  return json({ data });
}

export function sendCreated(entityName: string, cuid: string) {
  return json({
    data: {
      message: `${entityName} created successfully`,
      cuid
    }
  }, { status: 201 });
}

export function sendUpdated(entityName: string, cuid: string) {
  return json({
    data: {
      message: `${entityName} updated successfully`,
      cuid
    }
  }, { status: 200 });
}

export function sendDeleted(entityName: string, cuid: string) {
  return json({
    data: {
      message: `${entityName} deleted successfully`,
      cuid
    }
  }, { status: 200 });
}

// Field Mappers / DTOs to exclude internal metadata
export function mapRole(role: any) {
  return {
    cuid: role.cuid,
    name: role.name,
    name: role.name,
    status: role.status,
    created_by: role.created_by ?? null,
    updated_by: role.updated_by ?? null
  };
}

export function mapShift(shift: any) {
  return {
    cuid: shift.cuid,
    shift_name: shift.shift_name,
    start_time: shift.start_time,
    end_time: shift.end_time,
    minimum_work_hours: Number(shift.minimum_work_hours),
    status: shift.status,
    created_by: shift.created_by ?? null,
    updated_by: shift.updated_by ?? null
  };
}

export function mapLocation(loc: any) {
  return {
    cuid: loc.cuid,
    name: loc.name,
    name: loc.name,
    address_line1: loc.address_line1,
    address_line2: loc.address_line2,
    city: loc.city,
    state_cuid: loc.state_cuid,
    country_cuid: loc.country_cuid,
    pin_code: loc.pin_code,
    timezone: loc.timezone,
    latitude: loc.latitude ? Number(loc.latitude) : null,
    longitude: loc.longitude ? Number(loc.longitude) : null,
    status: loc.status,
    created_by: loc.created_by ?? null,
    updated_by: loc.updated_by ?? null
  };
}

export function mapCountry(country: any) {
  return {
    cuid: country.cuid,
    name: country.name
  };
}

export function mapState(state: any) {
  return {
    cuid: state.cuid,
    name: state.name,
    country_cuid: state.country_cuid
  };
}
