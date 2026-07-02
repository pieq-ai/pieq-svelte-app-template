import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import { notificationFactory } from '$lib/server/notifications/notification.factory.js';
import { invalidateHolidayCache } from '$lib/server/config/leave.config.js';

export const HOLIDAY_NAME_MAX_LENGTH = 200;
const VALID_HOLIDAY_TYPES = new Set<string>(['National', 'Regional', 'Restricted']);

export class HolidayValidationError extends Error {
	readonly field: 'name' | 'date' | 'type';

	constructor(field: 'name' | 'date' | 'type', message: string) {
		super(message);
		this.name = 'HolidayValidationError';
		this.field = field;
	}
}

export class HolidayMultiValidationError extends Error {
	readonly fields: Record<string, string>;

	constructor(fields: Record<string, string>) {
		super('Validation failed');
		this.name = 'HolidayMultiValidationError';
		this.fields = fields;
	}
}

export interface CreateHolidayInput {
	name: unknown;
	date: unknown;
	type: unknown;
	created_by?: string | null;
	updated_by?: string | null;
}

export interface UpdateHolidayInput {
	name?: unknown;
	date?: unknown;
	type?: unknown;
	updated_by?: string | null;
}

function validateHolidayName(raw: unknown): string {
	if (typeof raw !== 'string') {
		throw new HolidayValidationError('name', 'Holiday name is required and must be a string');
	}

	const trimmed = raw.trim();

	if (trimmed.length === 0) {
		throw new HolidayValidationError('name', 'Holiday name cannot be empty');
	}

	if (trimmed.length <= 5) {
		throw new HolidayValidationError(
			'name',
			'Holiday name must be more than 5 characters long'
		);
	}

	if (trimmed.length > HOLIDAY_NAME_MAX_LENGTH) {
		throw new HolidayValidationError(
			'name',
			`Holiday name must be ${HOLIDAY_NAME_MAX_LENGTH} characters or fewer`
		);
	}

	const HOLIDAY_NAME_REGEX = /^[a-zA-Z\s]+$/;
	if (!HOLIDAY_NAME_REGEX.test(trimmed)) {
		throw new HolidayValidationError(
			'name',
			'Holiday name can only contain letters and spaces'
		);
	}

	return trimmed;
}

function validateHolidayDate(raw: unknown): Date {
	if (!raw || (typeof raw === 'string' && raw.trim() === '')) {
		throw new HolidayValidationError('date', 'Holiday date is required');
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
		throw new HolidayValidationError('date', 'Holiday date must be a valid date');
	}

	if (isNaN(date.getTime())) {
		throw new HolidayValidationError('date', 'Holiday date must be a valid date');
	}

	const year = date.getUTCFullYear();
	if (year > 2099) {
		throw new HolidayValidationError(
			'date',
			'You can schedule holidays only up to the year 2099'
		);
	}
	if (year < 2000) {
		throw new HolidayValidationError(
			'date',
			'Holiday date must be between the years 2000 and 2099'
		);
	}

	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
	if (date.getTime() < todayUTC.getTime()) {
		throw new HolidayValidationError(
			'date',
			'Holiday date cannot be in the past'
		);
	}

	return date;
}

function validateHolidayType(raw: unknown): string {
	if (typeof raw !== 'string') {
		throw new HolidayValidationError('type', 'Holiday type is required and must be a string');
	}

	const trimmed = raw.trim();

	if (!VALID_HOLIDAY_TYPES.has(trimmed)) {
		throw new HolidayValidationError(
			'type',
			`Holiday type must be one of: ${Array.from(VALID_HOLIDAY_TYPES).join(', ')}`
		);
	}

	return trimmed;
}

export async function listHolidays() {
	return holidayDao.list();
}

export async function getHolidayByCuid(cuid: string) {
	return holidayDao.findByCuid(cuid);
}

export async function createHoliday(input: CreateHolidayInput) {
	const holiday_name = validateHolidayName(input.name);
	const holiday_date = validateHolidayDate(input.date);
	const holiday_type = validateHolidayType(input.type);

	// Unique date and name check (non-fail-fast)
	const errors: Record<string, string> = {};
	
	const existingDate = await holidayDao.findByDate(holiday_date);
	if (existingDate) {
		errors.date = 'Holiday already scheduled for this date';
	}

	const existingNameInYear = await holidayDao.findByNameAndYear(
		holiday_name,
		holiday_date.getUTCFullYear()
	);
	if (existingNameInYear) {
		errors.name = 'Holiday Name already exists';
	}

	if (Object.keys(errors).length > 0) {
		throw new HolidayMultiValidationError(errors);
	}

	const result = await holidayDao.create({ name: holiday_name, date: holiday_date, type: holiday_type, created_by: input.created_by, updated_by: input.updated_by });
	invalidateHolidayCache();

	// Trigger holiday added notification
	notificationFactory.holidayCreated(result.name, result.date, input.created_by)
		.catch(err => console.error("Failed to send holiday created notification:", err));

	return result;
}

export async function updateHoliday(cuid: string, input: UpdateHolidayInput) {
	if (!cuid || typeof cuid !== 'string') {
		throw new Error('Holiday CUID is required for updates');
	}

	const existingHoliday = await holidayDao.findByCuid(cuid);
	if (!existingHoliday) {
		throw new Error('Holiday not found');
	}

	const holiday_name = input.name !== undefined ? validateHolidayName(input.name) : existingHoliday.name;
	const holiday_date = input.date !== undefined ? validateHolidayDate(input.date) : existingHoliday.date;
	const holiday_type = input.type !== undefined ? validateHolidayType(input.type) : existingHoliday.type;

	// Unique date and name check excluding this CUID (non-fail-fast)
	const errors: Record<string, string> = {};

	const duplicateDate = await holidayDao.findByDateExcludingCuid(holiday_date, cuid);
	if (duplicateDate) {
		errors.date = 'Holiday already scheduled for this date';
	}

	const duplicateNameInYear = await holidayDao.findByNameAndYearExcludingCuid(
		holiday_name,
		holiday_date.getUTCFullYear(),
		cuid
	);
	if (duplicateNameInYear) {
		errors.name = 'Holiday Name already exists';
	}

	if (Object.keys(errors).length > 0) {
		throw new HolidayMultiValidationError(errors);
	}

	const result = await holidayDao.update(cuid, { name: holiday_name, date: holiday_date, type: holiday_type, updated_by: input.updated_by });
	invalidateHolidayCache();
	return result;
}

export async function deleteHoliday(cuid: string) {
	if (!cuid || typeof cuid !== 'string') {
		throw new Error('Holiday CUID is required for deletion');
	}

	const existingHoliday = await holidayDao.findByCuid(cuid);
	if (!existingHoliday) {
		throw new Error('Holiday not found');
	}

	const result = await holidayDao.deleteHoliday(cuid);
	invalidateHolidayCache();
	return result;
}
