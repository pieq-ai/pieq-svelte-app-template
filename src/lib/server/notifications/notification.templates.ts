import {
	NotificationCategory,
	NotificationPriority,
	NotificationType,
	NotificationTargetType
} from './notification.enums.js';
import type { NotificationTemplatePayload } from './notification.types.js';

function formatShiftDate(date: Date): string {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export const templates = {
	employeeJoined(firstName: string, lastName: string): NotificationTemplatePayload {
		return {
			title: 'New Team Member',
			body: `${firstName} ${lastName} has joined the company as a new team member!`,
			category: NotificationCategory.ANNOUNCEMENT,
			type: NotificationType.INFO,
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	holidayCreated(name: string, date: Date): NotificationTemplatePayload {
		return {
			title: 'New Holiday Scheduled',
			body: `A new company holiday "${name}" has been scheduled for ${date.toLocaleDateString()}.`,
			category: NotificationCategory.HOLIDAY,
			type: NotificationType.INFO,
			metadata: { link: '/holidays' },
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	leaveApplied(
		firstName: string,
		lastName: string,
		totalDays: number,
		startDate: any,
		requestCuid: string
	): NotificationTemplatePayload {
		const formattedDate = startDate instanceof Date ? startDate.toLocaleDateString() : 'N/A';
		return {
			title: 'Leave Application Submitted',
			body: `${firstName} ${lastName} has applied for ${totalDays} day(s) of leave starting on ${formattedDate}.`,
			category: NotificationCategory.LEAVE,
			type: NotificationType.INFO,
			metadata: { link: '/leaves', entityCuid: requestCuid },
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	leaveApproved(
		totalDays: number,
		startDate: any,
		employeeCuid: string,
		requestCuid: string
	): NotificationTemplatePayload {
		const formattedDate = startDate instanceof Date ? startDate.toLocaleDateString() : 'N/A';
		return {
			title: 'Leave Request Approved',
			body: `Your leave request for ${totalDays ?? 0} day(s) starting on ${formattedDate} has been approved.`,
			category: NotificationCategory.LEAVE,
			type: NotificationType.SUCCESS,
			metadata: { link: '/leaves', entityCuid: requestCuid },
			target: { type: NotificationTargetType.EMPLOYEE, employeeCuid }
		};
	},

	leaveRejected(
		totalDays: number,
		startDate: any,
		employeeCuid: string,
		requestCuid: string
	): NotificationTemplatePayload {
		const formattedDate = startDate instanceof Date ? startDate.toLocaleDateString() : 'N/A';
		return {
			title: 'Leave Request Rejected',
			body: `Your leave request for ${totalDays ?? 0} day(s) starting on ${formattedDate} has been rejected.`,
			category: NotificationCategory.LEAVE,
			type: NotificationType.ERROR,
			metadata: { link: '/leaves', entityCuid: requestCuid },
			target: { type: NotificationTargetType.EMPLOYEE, employeeCuid }
		};
	},

	leaveWithdrawn(
		firstName: string,
		lastName: string,
		requestCuid: string
	): NotificationTemplatePayload {
		return {
			title: 'Leave Request Withdrawn',
			body: `${firstName} ${lastName} has withdrawn their leave request.`,
			category: NotificationCategory.LEAVE,
			type: NotificationType.WARNING,
			metadata: { link: '/leaves', entityCuid: requestCuid },
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	payrollProcessed(
		month: string | number,
		year: string | number
	): NotificationTemplatePayload {
		return {
			title: 'Payroll Processed',
			body: `Payroll slips for ${month}/${year} have been uploaded and processed.`,
			category: NotificationCategory.PAYROLL,
			type: NotificationType.SUCCESS,
			metadata: { link: '/payrolls' },
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	payrollFailed(
		month: string | number,
		year: string | number,
		skippedCount: number,
		uploadCuid: string
	): NotificationTemplatePayload {
		return {
			title: 'Payroll Processing Failed',
			body: `The payroll upload for ${month}/${year} has failed. ${skippedCount} row(s) failed validation.`,
			category: NotificationCategory.PAYROLL,
			type: NotificationType.ERROR,
			priority: NotificationPriority.HIGH,
			metadata: { link: `/payrolls/${uploadCuid}` },
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	birthday(firstName: string, lastName: string): NotificationTemplatePayload {
		return {
			title: 'Happy Birthday!',
			body: `Wishing ${firstName} ${lastName} a very Happy Birthday today! 🎂🎉`,
			category: NotificationCategory.BIRTHDAY,
			type: NotificationType.INFO,
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	workAnniversary(
		firstName: string,
		lastName: string,
		years: number
	): NotificationTemplatePayload {
		return {
			title: 'Work Anniversary!',
			body: `Congratulations to ${firstName} ${lastName} on celebrating ${years} year${years > 1 ? 's' : ''} with the company today! 🏅✨`,
			category: NotificationCategory.ANNOUNCEMENT,
			type: NotificationType.INFO,
			target: { type: NotificationTargetType.BROADCAST }
		};
	},

	shiftAssigned(
		shiftName: string,
		startDate: Date,
		employeeCuid: string
	): NotificationTemplatePayload {
		const formattedDate = formatShiftDate(startDate);
		return {
			title: 'Shift Assigned',
			body: `You have been assigned to the ${shiftName} starting from ${formattedDate}.`,
			category: NotificationCategory.ATTENDANCE,
			type: NotificationType.INFO,
			metadata: { link: '/shift-assignments' },
			target: { type: NotificationTargetType.EMPLOYEE, employeeCuid }
		};
	},

	shiftReassigned(
		shiftName: string,
		startDate: Date,
		employeeCuid: string
	): NotificationTemplatePayload {
		const formattedDate = formatShiftDate(startDate);
		return {
			title: 'Shift Reassigned',
			body: `Your shift assignment has been updated to the ${shiftName} starting from ${formattedDate}.`,
			category: NotificationCategory.ATTENDANCE,
			type: NotificationType.INFO,
			metadata: { link: '/shift-assignments' },
			target: { type: NotificationTargetType.EMPLOYEE, employeeCuid }
		};
	},

	missingCheckoutReminder(
		employeeCuid: string,
		date: Date,
		attendanceRecordCuid: string
	): NotificationTemplatePayload {
		const formattedDate = formatShiftDate(date);
		return {
			title: 'Previous Day Checkout Missing',
			body: `You haven't checked out for your attendance on ${formattedDate}. Please complete the missing checkout.`,
			category: NotificationCategory.ATTENDANCE,
			type: NotificationType.WARNING,
			metadata: { link: '/attendance', entityCuid: attendanceRecordCuid },
			target: { type: NotificationTargetType.EMPLOYEE, employeeCuid }
		};
	}
};
