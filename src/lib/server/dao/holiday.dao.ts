import { db } from '$lib/server/db.js';
import type { HolidayTypeEnum } from '$lib/generated/prisma/enums.js';

export interface CreateHolidayData {
	holiday_name: string;
	holiday_date: Date;
	holiday_type: HolidayTypeEnum;
}

export async function list() {
	return db.holidayCalendar.findMany({
		orderBy: { holiday_date: 'asc' }
	});
}

export async function create(data: CreateHolidayData) {
	return db.holidayCalendar.create({
		data: {
			holiday_name: data.holiday_name,
			holiday_date: data.holiday_date,
			holiday_type: data.holiday_type
		}
	});
}

export async function update(uuid: string, data: Partial<CreateHolidayData>) {
	return db.holidayCalendar.update({
		where: { uuid },
		data
	});
}

export async function deleteHoliday(uuid: string) {
	return db.holidayCalendar.delete({
		where: { uuid }
	});
}

export async function findByUuid(uuid: string) {
	return db.holidayCalendar.findUnique({
		where: { uuid }
	});
}

export async function findByNameAndDate(holiday_name: string, holiday_date: Date) {
	return db.holidayCalendar.findFirst({
		where: {
			holiday_name,
			holiday_date
		}
	});
}

export async function findDuplicateExcludingUuid(
	holiday_name: string,
	holiday_date: Date,
	uuid: string
) {
	return db.holidayCalendar.findFirst({
		where: {
			holiday_name,
			holiday_date,
			NOT: { uuid }
		}
	});
}
