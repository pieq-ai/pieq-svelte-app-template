import { db } from '$lib/server/db.js';

export function toUtcDateString(date: Date): string {
	const yyyy = date.getUTCFullYear();
	const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(date.getUTCDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

export function isWeekend(date: Date): boolean {
	const day = date.getUTCDay();
	return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

let cachedHolidays: Set<string> | null = null;
let cachePromise: Promise<Set<string>> | null = null;

export async function getHolidaysCached(): Promise<Set<string>> {
	if (cachedHolidays) return cachedHolidays;
	if (cachePromise) return cachePromise;

	cachePromise = db.holidayCalendar.findMany({
		select: { date: true }
	}).then(list => {
		cachedHolidays = new Set(list.map(h => toUtcDateString(h.date)));
		cachePromise = null;
		return cachedHolidays;
	}).catch(err => {
		cachePromise = null;
		throw err;
	});

	return cachePromise;
}

export function invalidateHolidayCache(): void {
	cachedHolidays = null;
	cachePromise = null;
}

export function isHoliday(date: Date, holidaysSet?: Set<string>): boolean {
	const dateStr = toUtcDateString(date);
	if (holidaysSet) {
		return holidaysSet.has(dateStr);
	}
	return cachedHolidays ? cachedHolidays.has(dateStr) : false;
}

export function calculateLeaveDays(
	startDate: Date,
	endDate: Date,
	leaveCode: string,
	holidaysSet?: Set<string>
): number {
	let count = 0;
	const current = new Date(startDate);
	current.setUTCHours(0, 0, 0, 0);
	const end = new Date(endDate);
	end.setUTCHours(0, 0, 0, 0);

	const code = leaveCode.toUpperCase();
	const activeSet = holidaysSet || cachedHolidays || new Set<string>();

	while (current <= end) {
		if (code === 'ML' || code === 'LWP') {
			count++;
		} else {
			const dateStr = toUtcDateString(current);
			if (!isWeekend(current) && !activeSet.has(dateStr)) {
				count++;
			}
		}
		current.setUTCDate(current.getUTCDate() + 1);
	}
	return count;
}


