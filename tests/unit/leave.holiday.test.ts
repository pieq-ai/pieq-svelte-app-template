import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '$lib/server/db.js';
import {
	calculateLeaveDays,
	isHoliday,
	getHolidaysCached,
	invalidateHolidayCache
} from '$lib/server/config/leave.config.js';

vi.mock('$lib/server/db.js', () => {
	const mockDb = {
		holidayCalendar: {
			findMany: vi.fn()
		}
	};
	return { db: mockDb };
});

describe('Leave Holiday Calculations & Caching', () => {
	beforeEach(() => {
		invalidateHolidayCache();
		vi.clearAllMocks();
	});

	it('Scenario 1: Holiday exists in database and is excluded from CL calculation', async () => {
		// Mock DB to return Jan 26, 2026 as a holiday
		vi.mocked(db.holidayCalendar.findMany).mockResolvedValue([
			{ date: new Date(Date.UTC(2026, 0, 26)) } // 2026-01-26
		] as any);

		const holidaysSet = await getHolidaysCached();
		expect(isHoliday(new Date('2026-01-26'), holidaysSet)).toBe(true);

		// CL request from 2026-01-23 (Friday) to 2026-01-27 (Tuesday)
		// Total calendar days: 23, 24, 25, 26, 27 (5 days)
		// Weekend: 24 (Sat), 25 (Sun)
		// Holiday: 26 (Mon)
		// Working days: 23, 27 (2 days)
		const activeDays = calculateLeaveDays(
			new Date('2026-01-23'),
			new Date('2026-01-27'),
			'CL',
			holidaysSet
		);
		expect(activeDays).toBe(2);
	});

	it('Scenario 2 & 3: Dynamic additions and invalidation of holiday cache', async () => {
		// Start with one holiday: 2026-01-26
		vi.mocked(db.holidayCalendar.findMany).mockResolvedValue([
			{ date: new Date(Date.UTC(2026, 0, 26)) }
		] as any);

		let holidaysSet = await getHolidaysCached();
		expect(isHoliday(new Date('2026-01-26'), holidaysSet)).toBe(true);
		expect(isHoliday(new Date('2026-11-14'), holidaysSet)).toBe(false);

		// HR adds a new holiday: 2026-11-14 (Scenario 2)
		// Invalidate cache and update DB mock
		invalidateHolidayCache();
		vi.mocked(db.holidayCalendar.findMany).mockResolvedValue([
			{ date: new Date(Date.UTC(2026, 0, 26)) },
			{ date: new Date(Date.UTC(2026, 10, 14)) } // 2026-11-14
		] as any);

		holidaysSet = await getHolidaysCached();
		expect(isHoliday(new Date('2026-01-26'), holidaysSet)).toBe(true);
		expect(isHoliday(new Date('2026-11-14'), holidaysSet)).toBe(true);

		// HR removes the holiday 2026-01-26 (Scenario 3)
		// Invalidate cache and update DB mock
		invalidateHolidayCache();
		vi.mocked(db.holidayCalendar.findMany).mockResolvedValue([
			{ date: new Date(Date.UTC(2026, 10, 14)) }
		] as any);

		holidaysSet = await getHolidaysCached();
		expect(isHoliday(new Date('2026-01-26'), holidaysSet)).toBe(false);
		expect(isHoliday(new Date('2026-11-14'), holidaysSet)).toBe(true);
	});

	it('Scenario 4: Leave spanning weekend, holiday, and working day for different leave types', async () => {
		// Mock DB to return Jan 26, 2026 as a holiday
		vi.mocked(db.holidayCalendar.findMany).mockResolvedValue([
			{ date: new Date(Date.UTC(2026, 0, 26)) }
		] as any);

		const holidaysSet = await getHolidaysCached();

		// From Jan 23 (Friday) to Jan 27 (Tuesday)
		// Casual Leave (CL) -> should exclude weekend (24, 25) and holiday (26) => 2 days
		const clDays = calculateLeaveDays(
			new Date('2026-01-23'),
			new Date('2026-01-27'),
			'CL',
			holidaysSet
		);
		expect(clDays).toBe(2);

		// Maternity Leave (ML) -> should include all days => 5 days
		const mlDays = calculateLeaveDays(
			new Date('2026-01-23'),
			new Date('2026-01-27'),
			'ML',
			holidaysSet
		);
		expect(mlDays).toBe(5);

		// LWP -> should include all days => 5 days
		const lwpDays = calculateLeaveDays(
			new Date('2026-01-23'),
			new Date('2026-01-27'),
			'LWP',
			holidaysSet
		);
		expect(lwpDays).toBe(5);
	});
});
