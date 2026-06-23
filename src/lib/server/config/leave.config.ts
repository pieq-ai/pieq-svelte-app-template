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

export const PUBLIC_HOLIDAYS_2026 = [
	'2026-01-01', // New Year's Day
	'2026-01-26', // Republic Day
	'2026-04-03', // Good Friday
	'2026-05-01', // May Day
	'2026-08-15', // Independence Day
	'2026-10-02', // Gandhi Jayanti
	'2026-12-25'  // Christmas
];

export function isHoliday(date: Date): boolean {
	const dateStr = toUtcDateString(date);
	return PUBLIC_HOLIDAYS_2026.includes(dateStr);
}

export function calculateLeaveDays(startDate: Date, endDate: Date, leaveCode: string): number {
	let count = 0;
	const current = new Date(startDate);
	current.setUTCHours(0, 0, 0, 0);
	const end = new Date(endDate);
	end.setUTCHours(0, 0, 0, 0);

	const code = leaveCode.toUpperCase();

	while (current <= end) {
		if (code === 'ML' || code === 'LWP') {
			count++;
		} else {
			if (!isWeekend(current) && !isHoliday(current)) {
				count++;
			}
		}
		current.setUTCDate(current.getUTCDate() + 1);
	}
	return count;
}

