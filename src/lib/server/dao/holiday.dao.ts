import { db } from '$lib/server/db.js';

export interface CreateHolidayData {
	name: string;
	date: Date;
	type: string;
	created_by?: string | null;
	updated_by?: string | null;
}

export async function list() {
	return db.holidayCalendar.findMany({
		select: {
			cuid: true,
			name: true,
			date: true,
			type: true
		},
		orderBy: { created_at: 'desc' }
	});
}

export async function create(data: CreateHolidayData) {
	return db.holidayCalendar.create({
		data: {
			name: data.name,
			date: data.date,
			type: data.type,
			created_by: data.created_by,
			updated_by: data.updated_by
		}
	});
}

export async function update(cuid: string, data: Partial<CreateHolidayData>) {
	const updateData: any = {};
	if (data.name !== undefined) updateData.name = data.name;
	if (data.date !== undefined) updateData.date = data.date;
	if (data.type !== undefined) updateData.type = data.type;
	if (data.created_by !== undefined) updateData.created_by = data.created_by;
	if (data.updated_by !== undefined) updateData.updated_by = data.updated_by;

	return db.holidayCalendar.update({
		where: { cuid },
		data: updateData
	});
}

export async function findByCuid(cuid: string) {
	return db.holidayCalendar.findUnique({
		where: { cuid },
		select: {
			cuid: true,
			name: true,
			date: true,
			type: true
		}
	});
}

export async function findByNameAndDate(holiday_name: string, holiday_date: Date) {
	return db.holidayCalendar.findFirst({
		where: {
			name: holiday_name,
			date: holiday_date
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
			name: holiday_name,
			date: holiday_date,
			NOT: { cuid }
		}
	});
}

export async function findByDate(holiday_date: Date) {
	return db.holidayCalendar.findFirst({
		where: { date: holiday_date }
	});
}

export async function findByDateExcludingCuid(holiday_date: Date, cuid: string) {
	return db.holidayCalendar.findFirst({
		where: {
			date: holiday_date,
			NOT: { cuid }
		}
	});
}

export async function findByNameAndYear(holiday_name: string, year: number) {
	const startOfYear = new Date(Date.UTC(year, 0, 1));
	const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
	return db.holidayCalendar.findFirst({
		where: {
			name: {
				equals: holiday_name,
				mode: 'insensitive'
			},
			date: {
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
			name: {
				equals: holiday_name,
				mode: 'insensitive'
			},
			date: {
				gte: startOfYear,
				lte: endOfYear
			},
			NOT: { cuid }
		}
	});
}
