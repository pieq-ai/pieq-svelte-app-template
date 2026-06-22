import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	list,
	create,
	update,
	deleteHoliday,
	findByCuid,
	findByNameAndDate,
	findDuplicateExcludingCuid,
	findByDate,
	findByDateExcludingCuid,
	findByNameAndYear,
	findByNameAndYearExcludingCuid
} from '$lib/server/dao/holiday.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			holidayCalendar: {
				findMany: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				findUnique: vi.fn(),
				findFirst: vi.fn()
			}
		}
	};
});

describe('holiday DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should list holiday calendar entries', async () => {
		const mockList = [{ cuid: 'c1', name: 'New Year', date: new Date(), type: 'National' }];
		vi.mocked(db.holidayCalendar.findMany).mockResolvedValue(mockList as any);

		const result = await list();
		expect(result).toBe(mockList);
		expect(db.holidayCalendar.findMany).toHaveBeenCalledWith({
			select: {
				cuid: true,
				name: true,
				date: true,
				type: true
			},
			orderBy: { created_at: 'desc' }
		});
	});

	it('should create holiday calendar entry', async () => {
		const data = { name: 'Independence Day', date: new Date(), type: 'National' };
		vi.mocked(db.holidayCalendar.create).mockResolvedValue({ id: 1n, ...data } as any);

		const result = await create(data);
		expect(result).toEqual({ id: 1n, ...data });
		expect(db.holidayCalendar.create).toHaveBeenCalledWith({ data });
	});

	it('should update holiday calendar entry', async () => {
		const data = { name: 'New Name' };
		vi.mocked(db.holidayCalendar.update).mockResolvedValue({ id: 1n, cuid: 'cuid-1', ...data } as any);

		const result = await update('cuid-1', data);
		expect(result).toEqual({ id: 1n, cuid: 'cuid-1', ...data });
		expect(db.holidayCalendar.update).toHaveBeenCalledWith({
			where: { cuid: 'cuid-1' },
			data: { name: 'New Name' }
		});
	});

	it('should delete holiday calendar entry', async () => {
		vi.mocked(db.holidayCalendar.delete).mockResolvedValue({ id: 1n } as any);

		const result = await deleteHoliday('cuid-1');
		expect(result).toEqual({ id: 1n });
		expect(db.holidayCalendar.delete).toHaveBeenCalledWith({ where: { cuid: 'cuid-1' } });
	});

	it('should find unique entry by cuid', async () => {
		const mockResult = { cuid: 'c1', name: 'Christmas' };
		vi.mocked(db.holidayCalendar.findUnique).mockResolvedValue(mockResult as any);

		const result = await findByCuid('c1');
		expect(result).toBe(mockResult);
	});

	it('should find by name and date', async () => {
		const date = new Date();
		vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue({ id: 1n } as any);

		await findByNameAndDate('Christmas', date);
		expect(db.holidayCalendar.findFirst).toHaveBeenCalledWith({
			where: { name: 'Christmas', date }
		});
	});

	it('should find duplicate excluding cuid', async () => {
		const date = new Date();
		vi.mocked(db.holidayCalendar.findFirst).mockResolvedValue({ id: 1n } as any);

		await findDuplicateExcludingCuid('Christmas', date, 'cuid-1');
		expect(db.holidayCalendar.findFirst).toHaveBeenCalledWith({
			where: { name: 'Christmas', date, NOT: { cuid: 'cuid-1' } }
		});
	});

	it('should find by date', async () => {
		const date = new Date();
		await findByDate(date);
		expect(db.holidayCalendar.findFirst).toHaveBeenCalledWith({
			where: { date }
		});
	});

	it('should find by date excluding cuid', async () => {
		const date = new Date();
		await findByDateExcludingCuid(date, 'c1');
		expect(db.holidayCalendar.findFirst).toHaveBeenCalledWith({
			where: { date, NOT: { cuid: 'c1' } }
		});
	});

	it('should find by name and year', async () => {
		await findByNameAndYear('Christmas', 2026);
		expect(db.holidayCalendar.findFirst).toHaveBeenCalledWith({
			where: {
				name: { equals: 'Christmas', mode: 'insensitive' },
				date: {
					gte: new Date(Date.UTC(2026, 0, 1)),
					lte: new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999))
				}
			}
		});
	});

	it('should find by name and year excluding cuid', async () => {
		await findByNameAndYearExcludingCuid('Christmas', 2026, 'c1');
		expect(db.holidayCalendar.findFirst).toHaveBeenCalledWith({
			where: {
				name: { equals: 'Christmas', mode: 'insensitive' },
				date: {
					gte: new Date(Date.UTC(2026, 0, 1)),
					lte: new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999))
				},
				NOT: { cuid: 'c1' }
			}
		});
	});
});
