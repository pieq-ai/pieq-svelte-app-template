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

	if (trimmed.length <= 5) {
		throw new HolidayValidationError(
			'holiday_name',
			'Holiday name must be more than 5 characters long'
		);
	}

	if (trimmed.length > HOLIDAY_NAME_MAX_LENGTH) {
		throw new HolidayValidationError(
			'holiday_name',
			`Holiday name must be ${HOLIDAY_NAME_MAX_LENGTH} characters or fewer`
		);
	}

	const HOLIDAY_NAME_REGEX = /^[a-zA-Z\s]+$/;
	if (!HOLIDAY_NAME_REGEX.test(trimmed)) {
		throw new HolidayValidationError(
			'holiday_name',
			'Holiday name can only contain letters and spaces'
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

	const year = date.getUTCFullYear();
	if (year < 2000 || year > 2099) {
		throw new HolidayValidationError(
			'holiday_date',
			'Holiday date must be between the years 2000 and 2099'
		);
	}

	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
	if (date.getTime() <= todayUTC.getTime()) {
		throw new HolidayValidationError(
			'holiday_date',
			'Holiday date must be a future date.'
		);
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

export async function getHolidayByCuid(cuid: string) {
	return holidayDao.findByCuid(cuid);
}

export async function createHoliday(input: CreateHolidayInput) {
	const holiday_name = validateHolidayName(input.holiday_name);
	const holiday_date = validateHolidayDate(input.holiday_date);
	const holiday_type = validateHolidayType(input.holiday_type);

	// Unique date check
	const existingDate = await holidayDao.findByDate(holiday_date);
	if (existingDate) {
		throw new HolidayValidationError(
			'holiday_date',
			'A holiday is already scheduled on this date'
		);
	}

	// Unique name per calendar year check
	const existingNameInYear = await holidayDao.findByNameAndYear(
		holiday_name,
		holiday_date.getUTCFullYear()
	);
	if (existingNameInYear) {
		throw new HolidayValidationError(
			'holiday_name',
			'A holiday with this name already exists in the same calendar year'
		);
	}

	return holidayDao.create({ holiday_name, holiday_date, holiday_type });
}

export async function updateHoliday(cuid: string, input: UpdateHolidayInput) {
	if (!cuid || typeof cuid !== 'string') {
		throw new Error('Holiday CUID is required for updates');
	}

	const existingHoliday = await holidayDao.findByCuid(cuid);
	if (!existingHoliday) {
		throw new Error('Holiday not found');
	}

	const holiday_name = validateHolidayName(input.holiday_name);
	const holiday_date = validateHolidayDate(input.holiday_date);
	const holiday_type = validateHolidayType(input.holiday_type);

	// Unique date check excluding this CUID
	const duplicateDate = await holidayDao.findByDateExcludingCuid(holiday_date, cuid);
	if (duplicateDate) {
		throw new HolidayValidationError(
			'holiday_date',
			'A holiday is already scheduled on this date'
		);
	}

	// Unique name per calendar year check excluding this CUID
	const duplicateNameInYear = await holidayDao.findByNameAndYearExcludingCuid(
		holiday_name,
		holiday_date.getUTCFullYear(),
		cuid
	);
	if (duplicateNameInYear) {
		throw new HolidayValidationError(
			'holiday_name',
			'A holiday with this name already exists in the same calendar year'
		);
	}

	return holidayDao.update(cuid, { holiday_name, holiday_date, holiday_type });
}

export async function deleteHoliday(cuid: string) {
	if (!cuid || typeof cuid !== 'string') {
		throw new Error('Holiday CUID is required for deletion');
	}

	const existingHoliday = await holidayDao.findByCuid(cuid);
	if (!existingHoliday) {
		throw new Error('Holiday not found');
	}

	return holidayDao.deleteHoliday(cuid);
}
