import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { processDailyNotifications } from '$lib/server/services/scheduled-jobs.js';
import { db } from '$lib/server/db.js';
import { notificationFactory } from '$lib/server/notifications/notification.factory.js';
import { NotificationCategory } from '$lib/server/notifications/notification.enums.js';

vi.mock('$lib/server/services/audit.service.js', () => {
	return {
		log: vi.fn().mockResolvedValue({} as any),
		logUpdate: vi.fn().mockResolvedValue({} as any)
	};
});

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			employee: {
				findMany: vi.fn()
			},
			employment: {
				findMany: vi.fn()
			},
			notification: {
				findMany: vi.fn()
			}
		}
	};
});

describe('scheduled notifications daily jobs', () => {
	let birthdaySpy: any;
	let anniversarySpy: any;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		birthdaySpy = vi.spyOn(notificationFactory, 'birthday').mockResolvedValue({} as any);
		anniversarySpy = vi.spyOn(notificationFactory, 'workAnniversary').mockResolvedValue({} as any);
	});

	afterEach(() => {
		vi.useRealTimers();
		birthdaySpy.mockRestore();
		anniversarySpy.mockRestore();
	});

	it('should trigger birthday and anniversary on the correct UTC date', async () => {
		// July 6 (months are 0-indexed: 6 is July)
		const mockNow = new Date(Date.UTC(2026, 6, 6, 10, 0, 0));
		vi.setSystemTime(mockNow);

		const mockEmployees = [
			{ cuid: 'emp1', first_name: 'John', last_name: 'Doe', dob: new Date(Date.UTC(1990, 6, 6)) },
			{ cuid: 'emp2', first_name: 'Jane', last_name: 'Smith', dob: new Date(Date.UTC(1992, 6, 7)) }
		];
		vi.mocked(db.employee.findMany).mockResolvedValue(mockEmployees as any);

		const mockEmployments = [
			{ employee_cuid: 'emp1', date_of_joining: new Date(Date.UTC(2024, 6, 6)) },
			{ employee_cuid: 'emp2', date_of_joining: new Date(Date.UTC(2026, 6, 6)) }
		];
		vi.mocked(db.employment.findMany).mockResolvedValue(mockEmployments as any);

		vi.mocked(db.notification.findMany).mockResolvedValue([]);

		await processDailyNotifications();

		expect(birthdaySpy).toHaveBeenCalledTimes(1);
		expect(birthdaySpy).toHaveBeenCalledWith('John', 'Doe', 'emp1');

		expect(anniversarySpy).toHaveBeenCalledTimes(1);
		expect(anniversarySpy).toHaveBeenCalledWith('John', 'Doe', 2, 'emp1');
	});

	it('should prevent duplicates if run multiple times (idempotency)', async () => {
		const mockNow = new Date(Date.UTC(2026, 6, 6, 10, 0, 0));
		vi.setSystemTime(mockNow);

		const mockEmployees = [
			{ cuid: 'emp1', first_name: 'John', last_name: 'Doe', dob: new Date(Date.UTC(1990, 6, 6)) }
		];
		vi.mocked(db.employee.findMany).mockResolvedValue(mockEmployees as any);

		const mockEmployments = [
			{ employee_cuid: 'emp1', date_of_joining: new Date(Date.UTC(2024, 6, 6)) }
		];
		vi.mocked(db.employment.findMany).mockResolvedValue(mockEmployments as any);

		const mockExisting = [
			{
				category: NotificationCategory.BIRTHDAY,
				metadata: { employeeCuid: 'emp1', subType: 'birthday' }
			}
		];
		vi.mocked(db.notification.findMany).mockResolvedValue(mockExisting as any);

		await processDailyNotifications();

		expect(birthdaySpy).not.toHaveBeenCalled();

		expect(anniversarySpy).toHaveBeenCalledTimes(1);
		expect(anniversarySpy).toHaveBeenCalledWith('John', 'Doe', 2, 'emp1');
	});

	it('should check dates using UTC and ignore server local timezone shifts', async () => {
		const mockNow = new Date(Date.UTC(2026, 6, 6, 23, 0, 0));
		vi.setSystemTime(mockNow);

		const mockEmployees = [
			{ cuid: 'emp1', first_name: 'John', last_name: 'Doe', dob: new Date(Date.UTC(1990, 6, 6)) }
		];
		vi.mocked(db.employee.findMany).mockResolvedValue(mockEmployees as any);
		vi.mocked(db.employment.findMany).mockResolvedValue([]);
		vi.mocked(db.notification.findMany).mockResolvedValue([]);

		await processDailyNotifications();

		expect(birthdaySpy).toHaveBeenCalledTimes(1);
		expect(birthdaySpy).toHaveBeenCalledWith('John', 'Doe', 'emp1');
	});
});
