import * as leaveTypeDao from '$lib/server/dao/leave-type.dao.js';

export const LEAVE_NAME_MAX_LENGTH = 100;
export const LEAVE_CODE_MAX_LENGTH = 20;

export class LeaveValidationError extends Error {
	readonly field?: string;

	constructor(field: string | undefined, message: string) {
		super(message);
		this.name = 'LeaveValidationError';
		this.field = field;
	}
}

export class LeaveMultiValidationError extends Error {
	readonly fields: Record<string, string>;

	constructor(fields: Record<string, string>) {
		super('Validation failed');
		this.name = 'LeaveMultiValidationError';
		this.fields = fields;
	}
}

export interface CreateLeaveTypeInput {
	name: unknown;
	code: unknown;
	description?: unknown;
	is_paid?: unknown;
	requires_approval?: unknown;
	status?: unknown;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface UpdateLeaveTypeInput {
	name?: unknown;
	code?: unknown;
	description?: unknown;
	is_paid?: unknown;
	requires_approval?: unknown;
	status?: unknown;
	updated_by?: string | null;
}

function validateLeaveName(raw: unknown): string {
	if (typeof raw !== 'string' || raw.trim() === '') {
		throw new LeaveValidationError('name', 'Leave name is required');
	}

	const trimmed = raw.trim();

	if (trimmed.length <= 5) {
		throw new LeaveValidationError(
			'name',
			'Leave name must be more than 5 characters long'
		);
	}

	if (trimmed.length > LEAVE_NAME_MAX_LENGTH) {
		throw new LeaveValidationError(
			'name',
			`Leave name must be ${LEAVE_NAME_MAX_LENGTH} characters or fewer`
		);
	}

	const LEAVE_NAME_REGEX = /^[a-zA-Z\s]+$/;
	if (!LEAVE_NAME_REGEX.test(trimmed)) {
		throw new LeaveValidationError(
			'name',
			'Leave name can only contain letters and spaces'
		);
	}

	return trimmed;
}

function validateLeaveCode(raw: unknown): string {
	if (typeof raw !== 'string' || raw.trim() === '') {
		throw new LeaveValidationError('code', 'Leave code is required');
	}

	const converted = raw.trim().toUpperCase();

	if (converted.length > LEAVE_CODE_MAX_LENGTH) {
		throw new LeaveValidationError(
			'code',
			`Leave code must be ${LEAVE_CODE_MAX_LENGTH} characters or fewer`
		);
	}

	const LEAVE_CODE_REGEX = /^[A-Z_]+$/;
	if (!LEAVE_CODE_REGEX.test(converted)) {
		throw new LeaveValidationError(
			'code',
			'Leave code can only contain uppercase letters and underscores'
		);
	}

	return converted;
}

export async function listLeaveTypes() {
	return leaveTypeDao.list();
}

export async function getLeaveTypeByCuid(cuid: string) {
	return leaveTypeDao.findByCuid(cuid);
}

export async function createLeaveType(input: CreateLeaveTypeInput) {
	const leave_name = validateLeaveName(input.name);
	const leave_code = validateLeaveCode(input.code);
	const description = typeof input.description === 'string' ? input.description.trim() || null : null;
	const is_paid = input.is_paid === undefined ? true : Boolean(input.is_paid);
	const requires_approval = input.requires_approval === undefined ? true : Boolean(input.requires_approval);
	const status = input.status === undefined ? true : Boolean(input.status);

	// Duplicate checks
	const errors: Record<string, string> = {};
	const existingName = await leaveTypeDao.findByName(leave_name);
	if (existingName) {
		errors.name = 'Leave Name already exists';
	}

	const existingCode = await leaveTypeDao.findByCode(leave_code);
	if (existingCode) {
		errors.code = 'Leave Code already exists';
	}

	if (Object.keys(errors).length > 0) {
		throw new LeaveMultiValidationError(errors);
	}

	return leaveTypeDao.create({
		name: leave_name,
		code: leave_code,
		description,
		is_paid,
		requires_approval,
		status,
		created_by: input.created_by,
		updated_by: input.updated_by
	});
}

export async function updateLeaveType(cuid: string, input: UpdateLeaveTypeInput) {
	if (!cuid || typeof cuid !== 'string') {
		throw new Error('Leave type CUID is required for updates');
	}

	const existingType = await leaveTypeDao.findByCuid(cuid);
	if (!existingType) {
		throw new Error('Leave type not found');
	}

	const leave_name = input.name !== undefined ? validateLeaveName(input.name) : existingType.name;
	const leave_code = input.code !== undefined ? validateLeaveCode(input.code) : existingType.code;
	const description = input.description !== undefined ? (typeof input.description === 'string' ? input.description.trim() || null : null) : existingType.description;
	const is_paid = input.is_paid !== undefined ? Boolean(input.is_paid) : existingType.is_paid;
	const requires_approval = input.requires_approval !== undefined ? Boolean(input.requires_approval) : existingType.requires_approval;
	const status = input.status !== undefined ? Boolean(input.status) : existingType.status;

	// Duplicate checks excluding this cuid
	const errors: Record<string, string> = {};
	if (input.name !== undefined) {
		const duplicateName = await leaveTypeDao.findDuplicateName(leave_name, cuid);
		if (duplicateName) {
			errors.name = 'Leave Name already exists';
		}
	}

	if (input.code !== undefined) {
		const duplicateCode = await leaveTypeDao.findDuplicateCode(leave_code, cuid);
		if (duplicateCode) {
			errors.code = 'Leave Code already exists';
		}
	}

	if (Object.keys(errors).length > 0) {
		throw new LeaveMultiValidationError(errors);
	}

	return leaveTypeDao.update(cuid, {
		name: leave_name,
		code: leave_code,
		description,
		is_paid,
		requires_approval,
		status,
		updated_by: input.updated_by
	});
}
