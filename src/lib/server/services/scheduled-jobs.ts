import { db } from '$lib/server/db.js';
import * as notificationService from '$lib/server/services/notification.service.js';

/**
 * Runs daily scheduled notification triggers (Birthdays, Work Anniversaries).
 */
export async function processDailyNotifications() {
	const today = new Date();
	const todayMonth = today.getMonth();
	const todayDate = today.getDate();

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
		return dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDate;
	});

	for (const celebrant of birthdayCelebrants) {
		await notificationService.send({
			title: "Happy Birthday!",
			body: `Wishing ${celebrant.first_name} ${celebrant.last_name} a very Happy Birthday today! 🎂🎉`,
			category: "birthday",
			type: "info",
			trigger_source: "schedule.birthday",
			target: { type: "broadcast" }
		}).catch((err) => console.error('Failed to trigger birthday notification:', err));
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
		return (
			joinDate.getUTCMonth() === todayMonth &&
			joinDate.getUTCDate() === todayDate &&
			joinDate.getUTCFullYear() < today.getFullYear()
		);
	});

	for (const emp of anniversaryCelebrants) {
		const employee = employeesMap.get(emp.employee_cuid);
		if (!employee) continue;

		const years = today.getFullYear() - new Date(emp.date_of_joining!).getUTCFullYear();

		await notificationService.send({
			title: "Work Anniversary!",
			body: `Congratulations to ${employee.first_name} ${employee.last_name} on celebrating ${years} year${years > 1 ? 's' : ''} with the company today! 🏅✨`,
			category: "announcement",
			type: "info",
			trigger_source: "schedule.anniversary",
			target: { type: "broadcast" }
		}).catch((err) => console.error('Failed to trigger work anniversary notification:', err));
	}
}
