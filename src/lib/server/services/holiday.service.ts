import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import type { HolidayTypeEnum } from '$lib/generated/prisma/enums.js';

export const HOLIDAY_NAME_MAX_LENGTH = 200;
const VALID_HOLIDAY_TYPES = new Set<HolidayTypeEnum>(['national', 'regional', 'restricted']);

export class HolidayValidationError extends Error {
	readonly field: 'holiday_name' | 'holiday_date' | 'holiday_type';

	constructor(field: 'holiday_name' | 'holiday_date' | 'holiday_type', message: string) {
		super(message);
		this.name = 'HolidayValidationError';
		this.field = field;
	}
}

export interface CreateHolidayInput {
	holiday_name: unknown;
	holiday_date: unknown;
	holiday_type: unknown;
}

export interface UpdateHolidayInput {
	holiday_name?: unknown;
	holiday_date?: unknown;
	holiday_type?: unknown;
}

function validateHolidayName(raw: unknown): string {
	if (typeof raw !== 'string') {
		throw new HolidayValidationError('holiday_name', 'Holiday name is required and must be a string');
	}

	const trimmed = raw.trim();

	if (trimmed.length === 0) {
		throw new HolidayValidationError('holiday_name', 'Holiday name cannot be empty');
	}

	if (trimmed.length > HOLIDAY_NAME_MAX_LENGTH) {
		throw new HolidayValidationError(
			'holiday_name',
			`Holiday name must be ${HOLIDAY_NAME_MAX_LENGTH} characters or fewer`
		);
	}

	return trimmed;
}

function validateHolidayDate(raw: unknown): Date {
	if (!raw || (typeof raw === 'string' && raw.trim() === '')) {
		throw new HolidayValidationError('holiday_date', 'Holiday date is required');
	}

	let date: Date;

	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (match) {
			const year = parseInt(match[1], 10);
			const month = parseInt(match[2], 10) - 1; // 0-indexed
			const day = parseInt(match[3], 10);
			date = new Date(Date.UTC(year, month, day));
		} else {
			date = new Date(trimmed);
		}
	} else if (raw instanceof Date) {
		date = new Date(Date.UTC(raw.getFullYear(), raw.getMonth(), raw.getDate()));
	} else {
		throw new HolidayValidationError('holiday_date', 'Holiday date must be a valid date');
	}

	if (isNaN(date.getTime())) {
		throw new HolidayValidationError('holiday_date', 'Holiday date must be a valid date');
	}

	return date;
}

function validateHolidayType(raw: unknown): HolidayTypeEnum {
	if (typeof raw !== 'string') {
		throw new HolidayValidationError('holiday_type', 'Holiday type is required and must be a string');
	}

	const lowerType = raw.trim().toLowerCase() as HolidayTypeEnum;

	if (!VALID_HOLIDAY_TYPES.has(lowerType)) {
		throw new HolidayValidationError(
			'holiday_type',
			`Holiday type must be one of: ${Array.from(VALID_HOLIDAY_TYPES).join(', ')}`
		);
	}

	return lowerType;
}

export async function listHolidays() {
	return holidayDao.list();
}

export async function createHoliday(input: CreateHolidayInput) {
	const holiday_name = validateHolidayName(input.holiday_name);
	const holiday_date = validateHolidayDate(input.holiday_date);
	const holiday_type = validateHolidayType(input.holiday_type);

	// Duplicate check
	const existing = await holidayDao.findByNameAndDate(holiday_name, holiday_date);
	if (existing) {
		throw new HolidayValidationError(
			'holiday_name',
			'A holiday with this name and date already exists'
		);
	}

	return holidayDao.create({ holiday_name, holiday_date, holiday_type });
}

export async function updateHoliday(uuid: string, input: UpdateHolidayInput) {
	if (!uuid || typeof uuid !== 'string') {
		throw new Error('Holiday UUID is required for updates');
	}

	const existingHoliday = await holidayDao.findByUuid(uuid);
	if (!existingHoliday) {
		throw new Error('Holiday not found');
	}

	const holiday_name = validateHolidayName(input.holiday_name);
	const holiday_date = validateHolidayDate(input.holiday_date);
	const holiday_type = validateHolidayType(input.holiday_type);

	// Duplicate check excluding this uuid
	const duplicate = await holidayDao.findDuplicateExcludingUuid(
		holiday_name,
		holiday_date,
		uuid
	);
	if (duplicate) {
		throw new HolidayValidationError(
			'holiday_name',
			'A holiday with this name and date already exists'
		);
	}

	return holidayDao.update(uuid, { holiday_name, holiday_date, holiday_type });
}

export async function deleteHoliday(uuid: string) {
	if (!uuid || typeof uuid !== 'string') {
		throw new Error('Holiday UUID is required for deletion');
	}

	const existingHoliday = await holidayDao.findByUuid(uuid);
	if (!existingHoliday) {
		throw new Error('Holiday not found');
	}

	return holidayDao.deleteHoliday(uuid);
}
