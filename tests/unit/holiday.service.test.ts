import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import {
	createHoliday,
	updateHoliday,
	deleteHoliday,
	HolidayValidationError
} from '$lib/server/services/holiday.service.js';

vi.mock('$lib/server/dao/holiday.dao.js', () => {
	return {
		list: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deleteHoliday: vi.fn(),
		findByCuid: vi.fn(),
		findByNameAndDate: vi.fn(),
		findDuplicateExcludingCuid: vi.fn(),
		findByDate: vi.fn(),
		findByDateExcludingCuid: vi.fn(),
		findByNameAndYear: vi.fn(),
		findByNameAndYearExcludingCuid: vi.fn()
	};
});

const auditFields = { created_at: new Date(), updated_at: new Date() };

describe('holiday service', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Set current date to May 29, 2026 UTC
		vi.setSystemTime(new Date(Date.UTC(2026, 4, 29)));
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('validation and creation', () => {
		// Name checks
		it('should reject non-string names', async () => {
			await expect(
				createHoliday({
					holiday_name: 123,
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError('holiday_name', 'Holiday name is required and must be a string')
			);
		});

		it('should reject empty names', async () => {
			await expect(
				createHoliday({
					holiday_name: '   ',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError('holiday_name', 'Holiday name cannot be empty')
			);
		});

		it('should reject short names (<= 5 chars)', async () => {
			await expect(
				createHoliday({
					holiday_name: 'New',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_name',
					'Holiday name must be more than 5 characters long'
				)
			);
		});

		it('should reject names exceeding max length', async () => {
			const longName = 'A'.repeat(201);
			await expect(
				createHoliday({
					holiday_name: longName,
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_name',
					'Holiday name must be 200 characters or fewer'
				)
			);
		});

		it('should reject names with special characters or numbers', async () => {
			await expect(
				createHoliday({
					holiday_name: 'New Year 2026',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_name',
					'Holiday name can only contain letters and spaces'
				)
			);
		});

		// Date checks
		it('should reject empty date', async () => {
			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError('holiday_date', 'Holiday date is required')
			);
		});

		it('should reject invalid date strings', async () => {
			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: 'not-a-date',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError('holiday_date', 'Holiday date must be a valid date')
			);
		});

		it('should reject years outside 2000-2099', async () => {
			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '1999-12-31',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_date',
					'Holiday date must be between the years 2000 and 2099'
				)
			);

			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2100-01-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_date',
					'Holiday date must be between the years 2000 and 2099'
				)
			);
		});

		it('should reject past or current dates', async () => {
			// May 28, 2026 (past)
			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-05-28',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError('holiday_date', 'Holiday date must be a future date.')
			);

			// May 29, 2026 (today)
			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-05-29',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError('holiday_date', 'Holiday date must be a future date.')
			);
		});

		// Type checks
		it('should reject invalid holiday types', async () => {
			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-06-01',
					holiday_type: 'Public Holiday'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_type',
					'Holiday type must be one of: National, Regional, Restricted'
				)
			);
		});

		// Duplicate checks
		it('should reject creation if holiday on date already exists', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue({
				id: 1,
				cuid: 'cuid-1',
				holiday_name: 'Existing Holiday',
				holiday_date: new Date(Date.UTC(2026, 5, 1)),
				holiday_type: 'National',
				...auditFields
			});

			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_date',
					'A holiday is already scheduled on this date'
				)
			);
		});

		it('should reject creation if holiday name already exists in the same year', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYear).mockResolvedValue({
				id: 2,
				cuid: 'cuid-2',
				holiday_name: 'New Year Day',
				holiday_date: new Date(Date.UTC(2026, 0, 1)),
				holiday_type: 'National',
				...auditFields
			});

			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_name',
					'A holiday with this name already exists in the same calendar year'
				)
			);
		});

		it('should successfully create a holiday when all validations pass', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYear).mockResolvedValue(null);
			const expectedHoliday = {
				id: 3,
				cuid: 'new-cuid',
				holiday_name: 'New Year Day',
				holiday_date: new Date(Date.UTC(2026, 5, 1)),
				holiday_type: 'National',
				...auditFields
			};
			vi.mocked(holidayDao.create).mockResolvedValue(expectedHoliday);

			const result = await createHoliday({
				holiday_name: 'New Year Day',
				holiday_date: '2026-06-01',
				holiday_type: 'National'
			});

			expect(result).toEqual(expectedHoliday);
			expect(holidayDao.create).toHaveBeenCalledWith({
				holiday_name: 'New Year Day',
				holiday_date: new Date(Date.UTC(2026, 5, 1)),
				holiday_type: 'National'
			});
		});
	});

	describe('updating holidays', () => {
		const targetCuid = 'holiday-cuid';

		it('should throw error when holiday is not found', async () => {
			vi.mocked(holidayDao.findByCuid).mockResolvedValue(null);

			await expect(
				updateHoliday(targetCuid, {
					holiday_name: 'Valid Name',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrow('Holiday not found');
		});

		it('should reject update if the date conflicts with another holiday', async () => {
			vi.mocked(holidayDao.findByCuid).mockResolvedValue({
				id: 4,
				cuid: targetCuid,
				holiday_name: 'Old Name',
				holiday_date: new Date(Date.UTC(2026, 5, 1)),
				holiday_type: 'National',
				...auditFields
			});
			vi.mocked(holidayDao.findByDateExcludingCuid).mockResolvedValue({
				id: 5,
				cuid: 'another-cuid',
				holiday_name: 'Conflicting Holiday',
				holiday_date: new Date(Date.UTC(2026, 5, 2)),
				holiday_type: 'Regional',
				...auditFields
			});

			await expect(
				updateHoliday(targetCuid, {
					holiday_name: 'Valid Name',
					holiday_date: '2026-06-02',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_date',
					'A holiday is already scheduled on this date'
				)
			);
		});

		it('should reject update if the name conflicts with another holiday in same year', async () => {
			vi.mocked(holidayDao.findByCuid).mockResolvedValue({
				id: 4,
				cuid: targetCuid,
				holiday_name: 'Old Name',
				holiday_date: new Date(Date.UTC(2026, 5, 1)),
				holiday_type: 'National',
				...auditFields
			});
			vi.mocked(holidayDao.findByDateExcludingCuid).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYearExcludingCuid).mockResolvedValue({
				id: 5,
				cuid: 'another-cuid',
				holiday_name: 'Conflicting Name',
				holiday_date: new Date(Date.UTC(2026, 8, 1)),
				holiday_type: 'Regional',
				...auditFields
			});

			await expect(
				updateHoliday(targetCuid, {
					holiday_name: 'Conflicting Name',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError(
					'holiday_name',
					'A holiday with this name already exists in the same calendar year'
				)
			);
		});

		it('should successfully update a holiday when validations pass', async () => {
			const existing = {
				id: 4,
				cuid: targetCuid,
				holiday_name: 'Old Name',
				holiday_date: new Date(Date.UTC(2026, 5, 1)),
				holiday_type: 'National',
				...auditFields
			};
			vi.mocked(holidayDao.findByCuid).mockResolvedValue(existing);
			vi.mocked(holidayDao.findByDateExcludingCuid).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYearExcludingCuid).mockResolvedValue(null);
			
			const updated = {
				...existing,
				holiday_name: 'Updated Name',
				holiday_date: new Date(Date.UTC(2026, 5, 2)),
				...auditFields
			};
			vi.mocked(holidayDao.update).mockResolvedValue(updated);

			const result = await updateHoliday(targetCuid, {
				holiday_name: 'Updated Name',
				holiday_date: '2026-06-02',
				holiday_type: 'National'
			});

			expect(result).toEqual(updated);
			expect(holidayDao.update).toHaveBeenCalledWith(targetCuid, {
				holiday_name: 'Updated Name',
				holiday_date: new Date(Date.UTC(2026, 5, 2)),
				holiday_type: 'National'
			});
		});
	});

	describe('deleting holidays', () => {
		const targetCuid = 'holiday-cuid';

		it('should throw error when holiday to delete is not found', async () => {
			vi.mocked(holidayDao.findByCuid).mockResolvedValue(null);

			await expect(deleteHoliday(targetCuid)).rejects.toThrow('Holiday not found');
		});

		it('should successfully delete a holiday when it exists', async () => {
			const existing = {
				id: 6,
				cuid: targetCuid,
				holiday_name: 'New Year Day',
				holiday_date: new Date(Date.UTC(2026, 5, 1)),
				holiday_type: 'National',
				...auditFields
			};
			vi.mocked(holidayDao.findByCuid).mockResolvedValue(existing);
			vi.mocked(holidayDao.deleteHoliday).mockResolvedValue(existing);

			const result = await deleteHoliday(targetCuid);

			expect(result).toEqual(existing);
			expect(holidayDao.deleteHoliday).toHaveBeenCalledWith(targetCuid);
		});
	});
});
