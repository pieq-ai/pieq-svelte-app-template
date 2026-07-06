import { db } from '$lib/server/db.js';

export interface CreateNotificationInput {
	title: string;
	body: string;
	category: string;
	priority?: string;
	type?: string;
	metadata?: any;
	created_by?: string | null;
}

export interface ListNotificationsOptions {
	page?: number;
	limit?: number;
	unreadOnly?: boolean;
	category?: string;
	search?: string;
}

/**
 * Helper to fetch notification CUIDs that match category or search criteria.
 */
async function getMatchingNotificationCuids(category?: string, search?: string) {
	if (!category && !search) return null;

	const where: any = {};
	if (category) {
		where.category = category;
	}
	if (search) {
		where.OR = [
			{ title: { contains: search, mode: 'insensitive' } },
			{ body: { contains: search, mode: 'insensitive' } }
		];
	}

	const notifications = await db.notification.findMany({
		where,
		select: { cuid: true }
	});

	return notifications.map((n) => n.cuid);
}

/**
 * Creates a notification record.
 */
export async function createNotification(data: CreateNotificationInput, tx?: any) {
	const client = tx || db;
	return client.notification.create({
		data: {
			title: data.title,
			body: data.body,
			category: data.category,
			priority: data.priority ?? 'medium',
			type: data.type ?? 'info',
			metadata: data.metadata ?? undefined,
			created_by: data.created_by ?? undefined
		}
	});
}

/**
 * Creates notification recipients in bulk.
 */
export async function createRecipients(notificationCuid: string, employeeCuids: string[], tx?: any) {
	const client = tx || db;
	if (employeeCuids.length === 0) return { count: 0 };

	const data = employeeCuids.map((cuid) => ({
		notification_cuid: notificationCuid,
		employee_cuid: cuid
	}));

	return client.notificationRecipient.createMany({
		data,
		skipDuplicates: true
	});
}

/**
 * Lists active (unarchived) notifications for an employee.
 * Includes the linked Notification details.
 */
export async function listForEmployee(employeeCuid: string, options: ListNotificationsOptions = {}) {
	const page = options.page ?? 1;
	const limit = options.limit ?? 10;
	const skip = (page - 1) * limit;

	const where: any = {
		employee_cuid: employeeCuid,
		archived_at: null
	};

	if (options.unreadOnly) {
		where.read_at = null;
	}

	const matchingCuids = await getMatchingNotificationCuids(options.category, options.search);
	if (matchingCuids !== null) {
		// If filters are applied but no notifications match, we must return empty
		if (matchingCuids.length === 0) {
			return [];
		}
		where.notification_cuid = { in: matchingCuids };
	}

	// We resolve details in the application layer. First query matching recipients.
	const recipients = await db.notificationRecipient.findMany({
		where,
		orderBy: {
			created_at: 'desc'
		},
		skip,
		take: limit
	});

	if (recipients.length === 0) {
		return [];
	}

	const notificationCuids = recipients.map((r: any) => r.notification_cuid);

	// Fetch notifications matching those CUIDs
	const notifications = await db.notification.findMany({
		where: {
			cuid: { in: notificationCuids }
		}
	});

	// Map them together, keeping the descending recipient order
	const notificationsMap = new Map<string, any>(notifications.map((n: any) => [n.cuid, n]));

	return recipients.map((r: any) => {
		const n = notificationsMap.get(r.notification_cuid);
		return {
			cuid: r.cuid,
			notification_cuid: r.notification_cuid,
			employee_cuid: r.employee_cuid,
			read_at: r.read_at,
			created_at: r.created_at,
			title: n?.title ?? '',
			body: n?.body ?? '',
			category: n?.category ?? 'system',
			priority: n?.priority ?? 'medium',
			type: n?.type ?? 'info',
			metadata: n?.metadata ?? null,
			created_by: n?.created_by ?? null
		};
	});
}

/**
 * Counts active notifications for an employee.
 */
export async function countForEmployee(employeeCuid: string, options: ListNotificationsOptions = {}) {
	const where: any = {
		employee_cuid: employeeCuid,
		archived_at: null
	};

	if (options.unreadOnly) {
		where.read_at = null;
	}

	const matchingCuids = await getMatchingNotificationCuids(options.category, options.search);
	if (matchingCuids !== null) {
		if (matchingCuids.length === 0) {
			return 0;
		}
		where.notification_cuid = { in: matchingCuids };
	}

	return db.notificationRecipient.count({ where });
}


/**
 * Gets unread count for an employee (highly optimized).
 */
export async function unreadCountForEmployee(employeeCuid: string) {
	return db.notificationRecipient.count({
		where: {
			employee_cuid: employeeCuid,
			read_at: null,
			archived_at: null
		}
	});
}

/**
 * Marks a single recipient notification as read.
 */
export async function markAsRead(employeeCuid: string, recipientCuid: string) {
	return db.notificationRecipient.updateMany({
		where: {
			cuid: recipientCuid,
			employee_cuid: employeeCuid,
			read_at: null
		},
		data: {
			read_at: new Date()
		}
	});
}

/**
 * Marks all notifications for an employee as read.
 */
export async function markAllAsRead(employeeCuid: string) {
	return db.notificationRecipient.updateMany({
		where: {
			employee_cuid: employeeCuid,
			read_at: null,
			archived_at: null
		},
		data: {
			read_at: new Date()
		}
	});
}

/**
 * Soft deletes (archives) a notification for an employee.
 */
export async function archive(employeeCuid: string, recipientCuid: string) {
	return db.notificationRecipient.updateMany({
		where: {
			cuid: recipientCuid,
			employee_cuid: employeeCuid,
			archived_at: null
		},
		data: {
			archived_at: new Date()
		}
	});
}
