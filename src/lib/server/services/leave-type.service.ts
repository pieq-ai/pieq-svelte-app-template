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

export interface CreateLeaveTypeInput {
	leave_name: unknown;
	leave_code: unknown;
	description?: unknown;
	is_paid?: unknown;
	requires_approval?: unknown;
	status?: unknown;
}

export interface UpdateLeaveTypeInput {
	leave_name?: unknown;
	leave_code?: unknown;
	description?: unknown;
	is_paid?: unknown;
	requires_approval?: unknown;
	status?: unknown;
}

function validateLeaveName(raw: unknown): string {
	if (typeof raw !== 'string') {
		throw new LeaveValidationError('leave_name', 'Leave name is required and must be a string');
	}

	const trimmed = raw.trim();

	if (trimmed.length === 0) {
		throw new LeaveValidationError('leave_name', 'Leave name cannot be empty');
	}

	if (trimmed.length <= 5) {
		throw new LeaveValidationError(
			'leave_name',
			'Leave name must be more than 5 characters long'
		);
	}

	if (trimmed.length > LEAVE_NAME_MAX_LENGTH) {
		throw new LeaveValidationError(
			'leave_name',
			`Leave name must be ${LEAVE_NAME_MAX_LENGTH} characters or fewer`
		);
	}

	const LEAVE_NAME_REGEX = /^[a-zA-Z\s]+$/;
	if (!LEAVE_NAME_REGEX.test(trimmed)) {
		throw new LeaveValidationError(
			'leave_name',
			'Leave name can only contain letters and spaces'
		);
	}

	return trimmed;
}

function validateLeaveCode(raw: unknown): string {
	if (typeof raw !== 'string') {
		throw new LeaveValidationError('leave_code', 'Leave code is required and must be a string');
	}

	const converted = raw.trim().toUpperCase();

	if (converted.length === 0) {
		throw new LeaveValidationError('leave_code', 'Leave code cannot be empty');
	}

	if (converted.length > LEAVE_CODE_MAX_LENGTH) {
		throw new LeaveValidationError(
			'leave_code',
			`Leave code must be ${LEAVE_CODE_MAX_LENGTH} characters or fewer`
		);
	}

	const LEAVE_CODE_REGEX = /^[A-Z_]+$/;
	if (!LEAVE_CODE_REGEX.test(converted)) {
		throw new LeaveValidationError(
			'leave_code',
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
	const leave_name = validateLeaveName(input.leave_name);
	const leave_code = validateLeaveCode(input.leave_code);
	const description = typeof input.description === 'string' ? input.description.trim() || null : null;
	const is_paid = input.is_paid === undefined ? true : Boolean(input.is_paid);
	const requires_approval = input.requires_approval === undefined ? true : Boolean(input.requires_approval);
	const status = input.status === undefined ? true : Boolean(input.status);

	// Duplicate checks
	const existingName = await leaveTypeDao.findByName(leave_name);
	if (existingName) {
		throw new LeaveValidationError('leave_name', 'Leave name already exists');
	}

	const existingCode = await leaveTypeDao.findByCode(leave_code);
	if (existingCode) {
		throw new LeaveValidationError('leave_code', 'Leave code already exists');
	}

	return leaveTypeDao.create({
		leave_name,
		leave_code,
		description,
		is_paid,
		requires_approval,
		status
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

	const leave_name = input.leave_name !== undefined ? validateLeaveName(input.leave_name) : existingType.leave_name;
	const leave_code = input.leave_code !== undefined ? validateLeaveCode(input.leave_code) : existingType.leave_code;
	const description = input.description !== undefined ? (typeof input.description === 'string' ? input.description.trim() || null : null) : existingType.description;
	const is_paid = input.is_paid !== undefined ? Boolean(input.is_paid) : existingType.is_paid;
	const requires_approval = input.requires_approval !== undefined ? Boolean(input.requires_approval) : existingType.requires_approval;
	const status = input.status !== undefined ? Boolean(input.status) : existingType.status;

	// Duplicate checks excluding this cuid
	if (input.leave_name !== undefined) {
		const duplicateName = await leaveTypeDao.findDuplicateName(leave_name, cuid);
		if (duplicateName) {
			throw new LeaveValidationError('leave_name', 'Leave name already exists');
		}
	}

	if (input.leave_code !== undefined) {
		const duplicateCode = await leaveTypeDao.findDuplicateCode(leave_code, cuid);
		if (duplicateCode) {
			throw new LeaveValidationError('leave_code', 'Leave code already exists');
		}
	}

	return leaveTypeDao.update(cuid, {
		leave_name,
		leave_code,
		description,
		is_paid,
		requires_approval,
		status
	});
}

export async function deleteLeaveType(cuid: string) {
	if (!cuid || typeof cuid !== 'string') {
		throw new Error('Leave type CUID is required for deletion');
	}

	const existingType = await leaveTypeDao.findByCuid(cuid);
	if (!existingType) {
		throw new Error('Leave type not found');
	}

	return leaveTypeDao.deleteLeaveType(cuid);
}
