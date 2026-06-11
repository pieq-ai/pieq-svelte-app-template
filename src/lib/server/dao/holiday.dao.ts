import { db } from '$lib/server/db.js';

export interface CreateHolidayData {
	holiday_name: string;
	holiday_date: Date;
	holiday_type: string;
	created_by?: string | null;
	updated_by?: string | null;
}

export async function list() {
	return db.holidayCalendar.findMany({
		select: {
			cuid: true,
			holiday_name: true,
			holiday_date: true,
			holiday_type: true
		},
		orderBy: { created_at: 'desc' }
	});
}

export async function create(data: CreateHolidayData) {
	return db.holidayCalendar.create({
		data: {
			holiday_name: data.holiday_name,
			holiday_date: data.holiday_date,
			holiday_type: data.holiday_type,
			created_by: data.created_by,
			updated_by: data.updated_by
		}
	});
}

export async function update(cuid: string, data: Partial<CreateHolidayData>) {
	return db.holidayCalendar.update({
		where: { cuid },
		data
	});
}

export async function deleteHoliday(cuid: string) {
	return db.holidayCalendar.delete({
		where: { cuid }
	});
}

export async function findByCuid(cuid: string) {
	return db.holidayCalendar.findUnique({
		where: { cuid },
		select: {
			cuid: true,
			holiday_name: true,
			holiday_date: true,
			holiday_type: true
		}
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

export async function findDuplicateExcludingCuid(
	holiday_name: string,
	holiday_date: Date,
	cuid: string
) {
	return db.holidayCalendar.findFirst({
		where: {
			holiday_name,
			holiday_date,
			NOT: { cuid }
		}
	});
}

export async function findByDate(holiday_date: Date) {
	return db.holidayCalendar.findFirst({
		where: { holiday_date }
	});
}

export async function findByDateExcludingCuid(holiday_date: Date, cuid: string) {
	return db.holidayCalendar.findFirst({
		where: {
			holiday_date,
			NOT: { cuid }
		}
	});
}

export async function findByNameAndYear(holiday_name: string, year: number) {
	const startOfYear = new Date(Date.UTC(year, 0, 1));
	const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
	return db.holidayCalendar.findFirst({
		where: {
			holiday_name: {
				equals: holiday_name,
				mode: 'insensitive'
			},
			holiday_date: {
				gte: startOfYear,
				lte: endOfYear
			}
		}
	});
}

export async function findByNameAndYearExcludingCuid(
	holiday_name: string,
	year: number,
	cuid: string
) {
	const startOfYear = new Date(Date.UTC(year, 0, 1));
	const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
	return db.holidayCalendar.findFirst({
		where: {
			holiday_name: {
				equals: holiday_name,
				mode: 'insensitive'
			},
			holiday_date: {
				gte: startOfYear,
				lte: endOfYear
			},
			NOT: { cuid }
		}
	});
}
