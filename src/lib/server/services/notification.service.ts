import * as notificationDao from '$lib/server/dao/notification.dao.js';
import { resolveRecipients } from '$lib/server/services/recipient-resolver.service.js';
import { validateNotification } from '$lib/server/validators/notification.validator.js';
import { db } from '$lib/server/db.js';

export interface CreateNotificationDto {
	title: string;
	body: string;
	category: string;
	priority?: string;
	type?: string;
	payload?: any;
	trigger_source?: string | null;
	created_by?: string | null;
	target: {
		type: 'broadcast' | 'employee' | 'role' | 'department' | 'manager';
		employeeCuid?: string;
		roleCuid?: string;
		departmentCuid?: string;
	};
}

/**
 * Creates a notification and links it to resolved recipients inside a database transaction.
 */
export async function send(dto: CreateNotificationDto) {
	// 1. Validate notification details
	const validatedData = validateNotification(dto);

	// 2. Resolve target recipients (Employee CUIDs)
	const recipientCuids = await resolveRecipients(dto.target);
	if (recipientCuids.length === 0) {
		throw new Error(
			`[NotificationService] Failed to send notification: No active recipients resolved for target ${JSON.stringify(dto.target)}.`
		);
	}

	// 3. Save to database using a transaction
	return db.$transaction(async (tx) => {
		const notification = await notificationDao.createNotification(validatedData, tx);
		await notificationDao.createRecipients(notification.cuid, recipientCuids, tx);
		return notification;
	});
}

/**
 * Retrieves paginated notifications for an employee.
 */
export async function getNotificationsForEmployee(
	employeeCuid: string,
	options: notificationDao.ListNotificationsOptions = {}
) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required to fetch notifications');
	}
	return notificationDao.listForEmployee(employeeCuid, options);
}

/**
 * Counts total notifications for an employee.
 */
export async function getNotificationsCountForEmployee(
	employeeCuid: string,
	options: notificationDao.ListNotificationsOptions = {}
) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required to count notifications');
	}
	return notificationDao.countForEmployee(employeeCuid, options);
}

/**
 * Gets the number of unread notifications for an employee.
 */
export async function getUnreadCount(employeeCuid: string) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required to count unread notifications');
	}
	return notificationDao.unreadCountForEmployee(employeeCuid);
}

/**
 * Marks a specific notification as read.
 */
export async function markAsRead(employeeCuid: string, recipientCuid: string) {
	if (!employeeCuid || !recipientCuid) {
		throw new Error('Employee CUID and Recipient CUID are required');
	}
	return notificationDao.markAsRead(employeeCuid, recipientCuid);
}

/**
 * Marks all active notifications as read.
 */
export async function markAllAsRead(employeeCuid: string) {
	if (!employeeCuid) {
		throw new Error('Employee CUID is required to mark all read');
	}
	return notificationDao.markAllAsRead(employeeCuid);
}

/**
 * Archives (soft deletes) a notification.
 */
export async function archiveNotification(employeeCuid: string, recipientCuid: string) {
	if (!employeeCuid || !recipientCuid) {
		throw new Error('Employee CUID and Recipient CUID are required');
	}
	return notificationDao.archive(employeeCuid, recipientCuid);
}
