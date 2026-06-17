import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as holidayDao from '$lib/server/dao/holiday.dao.js';
import {
	createHoliday,
	updateHoliday,
	deleteHoliday,
	HolidayValidationError,
	HolidayMultiValidationError
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

const auditFields = { created_at: new Date(), updated_at: new Date(), created_by: null, updated_by: null };

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

		it('should reject past dates and allow current date', async () => {
			// May 28, 2026 (past)
			await expect(
				createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-05-28',
					holiday_type: 'National'
				})
			).rejects.toThrowError(
				new HolidayValidationError('holiday_date', 'Holiday date cannot be in the past.')
			);

			// May 29, 2026 (today) - should be allowed
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYear).mockResolvedValue(null);
			vi.mocked(holidayDao.create).mockResolvedValue({
				id: 99n,
				cuid: 'today-cuid',
				name: 'Today Holiday',
				date: new Date(Date.UTC(2026, 4, 29)),
				type: 'National',
				...auditFields
			});

			const result = await createHoliday({
				holiday_name: 'Today Holiday',
				holiday_date: '2026-05-29',
				holiday_type: 'National'
			});
			expect(result.cuid).toBe('today-cuid');
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
				id: 1n,
				cuid: 'cuid-1',
				name: 'Existing Holiday',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
				...auditFields
			});

			try {
				await createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				});
				expect.fail('Should have thrown HolidayMultiValidationError');
			} catch (error: any) {
				expect(error.name).toBe('HolidayMultiValidationError');
				expect(error.fields).toEqual({
					holiday_date: 'Holiday already scheduled for this date'
				});
			}
		});

		it('should reject creation if holiday name already exists in the same year', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYear).mockResolvedValue({
				id: 2n,
				cuid: 'cuid-2',
				name: 'New Year Day',
				date: new Date(Date.UTC(2026, 0, 1)),
				type: 'National',
				...auditFields
			});

			try {
				await createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				});
				expect.fail('Should have thrown HolidayMultiValidationError');
			} catch (error: any) {
				expect(error.name).toBe('HolidayMultiValidationError');
				expect(error.fields).toEqual({
					holiday_name: 'Holiday Name already exists'
				});
			}
		});

		it('should successfully create a holiday when all validations pass', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYear).mockResolvedValue(null);
			const expectedHoliday = {
				id: 3n,
				cuid: 'new-cuid',
				name: 'New Year Day',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
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
				name: 'New Year Day',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National'
			});
		});

		it('should reject creation with multiple validation errors if both name and date already exist', async () => {
			vi.mocked(holidayDao.findByDate).mockResolvedValue({
				id: 1n,
				cuid: 'cuid-1',
				name: 'Existing Holiday',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
				...auditFields
			});
			vi.mocked(holidayDao.findByNameAndYear).mockResolvedValue({
				id: 2n,
				cuid: 'cuid-2',
				name: 'New Year Day',
				date: new Date(Date.UTC(2026, 0, 1)),
				type: 'National',
				...auditFields
			});

			try {
				await createHoliday({
					holiday_name: 'New Year Day',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				});
				expect.fail('Should have thrown HolidayMultiValidationError');
			} catch (error: any) {
				expect(error.name).toBe('HolidayMultiValidationError');
				expect(error.fields).toEqual({
					holiday_date: 'Holiday already scheduled for this date',
					holiday_name: 'Holiday Name already exists'
				});
			}
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
				id: 4n,
				cuid: targetCuid,
				name: 'Old Name',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
				...auditFields
			} as any);
			vi.mocked(holidayDao.findByDateExcludingCuid).mockResolvedValue({
				id: 5n,
				cuid: 'another-cuid',
				name: 'Conflicting Holiday',
				date: new Date(Date.UTC(2026, 5, 2)),
				type: 'Regional',
				...auditFields
			});

			try {
				await updateHoliday(targetCuid, {
					holiday_name: 'Valid Name',
					holiday_date: '2026-06-02',
					holiday_type: 'National'
				});
				expect.fail('Should have thrown HolidayMultiValidationError');
			} catch (error: any) {
				expect(error.name).toBe('HolidayMultiValidationError');
				expect(error.fields).toEqual({
					holiday_date: 'Holiday already scheduled for this date'
				});
			}
		});

		it('should reject update if the name conflicts with another holiday in same year', async () => {
			vi.mocked(holidayDao.findByCuid).mockResolvedValue({
				id: 4n,
				cuid: targetCuid,
				name: 'Old Name',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
				...auditFields
			} as any);
			vi.mocked(holidayDao.findByDateExcludingCuid).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYearExcludingCuid).mockResolvedValue({
				id: 5n,
				cuid: 'another-cuid',
				name: 'Conflicting Name',
				date: new Date(Date.UTC(2026, 8, 1)),
				type: 'Regional',
				...auditFields
			});

			try {
				await updateHoliday(targetCuid, {
					holiday_name: 'Conflicting Name',
					holiday_date: '2026-06-01',
					holiday_type: 'National'
				});
				expect.fail('Should have thrown HolidayMultiValidationError');
			} catch (error: any) {
				expect(error.name).toBe('HolidayMultiValidationError');
				expect(error.fields).toEqual({
					holiday_name: 'Holiday Name already exists'
				});
			}
		});

		it('should successfully update a holiday when validations pass', async () => {
			const existing = {
				id: 4n,
				cuid: targetCuid,
				name: 'Old Name',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
				...auditFields
			};
			vi.mocked(holidayDao.findByCuid).mockResolvedValue(existing);
			vi.mocked(holidayDao.findByDateExcludingCuid).mockResolvedValue(null);
			vi.mocked(holidayDao.findByNameAndYearExcludingCuid).mockResolvedValue(null);
			
			const updated = {
				...existing,
				name: 'Updated Name',
				date: new Date(Date.UTC(2026, 5, 2)),
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
				name: 'Updated Name',
				date: new Date(Date.UTC(2026, 5, 2)),
				type: 'National'
			});
		});

		it('should reject update with multiple validation errors if both name and date conflict with other holidays', async () => {
			vi.mocked(holidayDao.findByCuid).mockResolvedValue({
				id: 4n,
				cuid: targetCuid,
				name: 'Old Name',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
				...auditFields
			} as any);
			vi.mocked(holidayDao.findByDateExcludingCuid).mockResolvedValue({
				id: 5n,
				cuid: 'another-cuid-1',
				name: 'Conflicting Holiday',
				date: new Date(Date.UTC(2026, 5, 2)),
				type: 'Regional',
				...auditFields
			});
			vi.mocked(holidayDao.findByNameAndYearExcludingCuid).mockResolvedValue({
				id: 6n,
				cuid: 'another-cuid-2',
				name: 'Conflicting Name',
				date: new Date(Date.UTC(2026, 8, 1)),
				type: 'Regional',
				...auditFields
			});

			try {
				await updateHoliday(targetCuid, {
					holiday_name: 'Conflicting Name',
					holiday_date: '2026-06-02',
					holiday_type: 'National'
				});
				expect.fail('Should have thrown HolidayMultiValidationError');
			} catch (error: any) {
				expect(error.name).toBe('HolidayMultiValidationError');
				expect(error.fields).toEqual({
					holiday_date: 'Holiday already scheduled for this date',
					holiday_name: 'Holiday Name already exists'
				});
			}
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
				id: 6n,
				cuid: targetCuid,
				name: 'New Year Day',
				date: new Date(Date.UTC(2026, 5, 1)),
				type: 'National',
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
