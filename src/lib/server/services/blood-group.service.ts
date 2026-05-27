import * as bloodGroupDao from '$lib/server/dao/blood-group.dao.js';

export const BLOOD_GROUP_NAME_MAX_LENGTH = 5;

export class BloodGroupValidationError extends Error {
	readonly field: 'blood_group_name';

	constructor(field: 'blood_group_name', message: string) {
		super(message);
		this.name = 'BloodGroupValidationError';
		this.field = field;
	}
}

export interface CreateBloodGroupInput {
	blood_group_name: unknown;
}

export interface UpdateBloodGroupInput {
	blood_group_name?: unknown;
}

function validateBloodGroupName(raw: unknown): string {
	if (typeof raw !== 'string') {
		throw new BloodGroupValidationError('blood_group_name', 'Blood group name is required and must be a string');
	}

	const trimmed = raw.trim();

	if (trimmed.length === 0) {
		throw new BloodGroupValidationError('blood_group_name', 'Blood group name cannot be empty');
	}

	if (trimmed.length > BLOOD_GROUP_NAME_MAX_LENGTH) {
		throw new BloodGroupValidationError(
			'blood_group_name',
			`Blood group name must be ${BLOOD_GROUP_NAME_MAX_LENGTH} characters or fewer`
		);
	}

	const upper = trimmed.toUpperCase();
	const BLOOD_GROUP_REGEX = /^(A|B|AB|O)[+-]$/;

	if (!BLOOD_GROUP_REGEX.test(upper)) {
		throw new BloodGroupValidationError(
			'blood_group_name',
			'Must be a valid format containing only group letters and Rh factor (e.g. A+, B+, AB+, O+, A-, B-, AB-, O-)'
		);
	}

	return upper;
}

export async function listBloodGroups() {
	return bloodGroupDao.list();
}

export async function createBloodGroup(input: CreateBloodGroupInput) {
	const blood_group_name = validateBloodGroupName(input.blood_group_name);

	// Duplicate check
	const existing = await bloodGroupDao.findByName(blood_group_name);
	if (existing) {
		throw new BloodGroupValidationError(
			'blood_group_name',
			'This blood group name already exists'
		);
	}

	return bloodGroupDao.create({ blood_group_name });
}

export async function updateBloodGroup(uuid: string, input: UpdateBloodGroupInput) {
	if (!uuid || typeof uuid !== 'string') {
		throw new Error('Blood Group UUID is required for updates');
	}

	const existingGroup = await bloodGroupDao.findByUuid(uuid);
	if (!existingGroup) {
		throw new Error('Blood Group not found');
	}

	const blood_group_name = validateBloodGroupName(input.blood_group_name);

	// Duplicate check excluding this uuid
	const duplicate = await bloodGroupDao.findDuplicateExcludingUuid(blood_group_name, uuid);
	if (duplicate) {
		throw new BloodGroupValidationError(
			'blood_group_name',
			'This blood group name already exists'
		);
	}

	return bloodGroupDao.update(uuid, { blood_group_name });
}

export async function deleteBloodGroup(uuid: string) {
	if (!uuid || typeof uuid !== 'string') {
		throw new Error('Blood Group UUID is required for deletion');
	}

	const existingGroup = await bloodGroupDao.findByUuid(uuid);
	if (!existingGroup) {
		throw new Error('Blood Group not found');
	}

	return bloodGroupDao.deleteBloodGroup(uuid);
}
