export function toLocalDateString(date: Date): string {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

export function isWeekend(date: Date): boolean {
	const day = date.getDay();
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
	const dateStr = toLocalDateString(date);
	return PUBLIC_HOLIDAYS_2026.includes(dateStr);
}

export function calculateLeaveDays(startDate: Date, endDate: Date, leaveCode: string): number {
	let count = 0;
	const current = new Date(startDate);
	current.setHours(0, 0, 0, 0);
	const end = new Date(endDate);
	end.setHours(0, 0, 0, 0);

	const code = leaveCode.toUpperCase();

	while (current <= end) {
		if (code === 'ML' || code === 'LWP') {
			count++;
		} else {
			if (!isWeekend(current) && !isHoliday(current)) {
				count++;
			}
		}
		current.setDate(current.getDate() + 1);
	}
	return count;
}
