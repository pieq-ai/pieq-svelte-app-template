import { db } from '$lib/server/db.js';
import { notificationFactory } from '$lib/server/notifications/notification.factory.js';
import { NotificationCategory } from '$lib/server/notifications/notification.enums.js';

/**
 * Runs daily scheduled notification triggers (Birthdays, Work Anniversaries).
 */
export async function processDailyNotifications() {
	const today = new Date();
	const todayMonth = today.getUTCMonth();
	const todayDate = today.getUTCDate();
	const todayYear = today.getUTCFullYear();

	const todayStart = new Date(Date.UTC(todayYear, todayMonth, todayDate, 0, 0, 0, 0));
	const todayEnd = new Date(Date.UTC(todayYear, todayMonth, todayDate, 23, 59, 59, 999));

	// Fetch all sent birthday/anniversary notifications for today in UTC
	const existingNotifications = await db.notification.findMany({
		where: {
			category: {
				in: [NotificationCategory.BIRTHDAY, NotificationCategory.ANNOUNCEMENT]
			},
			created_at: {
				gte: todayStart,
				lte: todayEnd
			}
		},
		select: {
			category: true,
			metadata: true
		}
	});

	const sentBirthdays = new Set<string>();
	const sentAnniversaries = new Set<string>();

	for (const notif of existingNotifications) {
		const meta = notif.metadata as any;
		if (meta && typeof meta === 'object' && meta.employeeCuid) {
			if (notif.category === NotificationCategory.BIRTHDAY) {
				sentBirthdays.add(meta.employeeCuid);
			} else if (notif.category === NotificationCategory.ANNOUNCEMENT) {
				sentAnniversaries.add(meta.employeeCuid);
			}
		}
	}

	// 1. Fetch all non-deleted employees
	const employees = await db.employee.findMany({
		where: {
			is_deleted: false
		},
		select: {
			cuid: true,
			first_name: true,
			last_name: true,
			dob: true
		}
	});

	const employeesMap = new Map(employees.map((emp) => [emp.cuid, emp]));

	// 2. Birthday notifications (checking UTC month/date to prevent local timezone shifts)
	const birthdayCelebrants = employees.filter((emp) => {
		if (!emp.dob) return false;
		const dob = new Date(emp.dob);
		const isBirthday = dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDate;
		return isBirthday && !sentBirthdays.has(emp.cuid);
	});

	for (const celebrant of birthdayCelebrants) {
		await notificationFactory.birthday(celebrant.first_name, celebrant.last_name, celebrant.cuid)
			.catch((err) => console.error('Failed to trigger birthday notification:', err));
	}

	// 3. Fetch employments for anniversary checks
	const employments = await db.employment.findMany({
		select: {
			employee_cuid: true,
			date_of_joining: true
		}
	});

	// 4. Work Anniversary notifications (checking UTC month/date)
	const anniversaryCelebrants = employments.filter((emp) => {
		if (!emp.date_of_joining) return false;
		const joinDate = new Date(emp.date_of_joining);
		const isAnniversary = (
			joinDate.getUTCMonth() === todayMonth &&
			joinDate.getUTCDate() === todayDate &&
			joinDate.getUTCFullYear() < todayYear
		);
		return isAnniversary && !sentAnniversaries.has(emp.employee_cuid);
	});

	for (const emp of anniversaryCelebrants) {
		const employee = employeesMap.get(emp.employee_cuid);
		if (!employee) continue;

		const years = todayYear - new Date(emp.date_of_joining!).getUTCFullYear();

		await notificationFactory.workAnniversary(employee.first_name, employee.last_name, years, employee.cuid)
			.catch((err) => console.error('Failed to trigger work anniversary notification:', err));
	}
}
