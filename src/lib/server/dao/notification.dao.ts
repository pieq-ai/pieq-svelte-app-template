import { db } from '$lib/server/db.js';
import { Prisma } from '$lib/generated/prisma/client.js';

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
/**
 * Builds the parameterized SQL WHERE clause conditions for active notifications.
 */
function buildConditions(employeeCuid: string, options: ListNotificationsOptions) {
	const conditions: Prisma.Sql[] = [
		Prisma.sql`nr.employee_cuid = ${employeeCuid}`,
		Prisma.sql`nr.archived_at IS NULL`
	];

	if (options.unreadOnly) {
		conditions.push(Prisma.sql`nr.read_at IS NULL`);
	}

	if (options.category) {
		conditions.push(Prisma.sql`n.category = ${options.category}`);
	}

	if (options.search) {
		const searchPattern = `%${options.search}%`;
		conditions.push(Prisma.sql`(n.title ILIKE ${searchPattern} OR n.body ILIKE ${searchPattern})`);
	}

	return Prisma.join(conditions, ' AND ');
}

/**
 * Lists active (unarchived) notifications for an employee.
 * Includes the linked Notification details.
 */
export async function listForEmployee(employeeCuid: string, options: ListNotificationsOptions = {}) {
	const page = options.page ?? 1;
	const limit = options.limit ?? 10;
	const skip = (page - 1) * limit;

	const whereClause = buildConditions(employeeCuid, options);

	const recipients = await db.$queryRaw`
		SELECT nr.cuid, nr.notification_cuid, nr.employee_cuid, nr.read_at, nr.created_at,
		       n.title, n.body, n.category, n.priority, n.type, n.metadata, n.created_by
		FROM notification_recipients nr
		JOIN notifications n ON nr.notification_cuid = n.cuid
		WHERE ${whereClause}
		ORDER BY nr.created_at DESC, nr.id DESC
		LIMIT ${limit} OFFSET ${skip}
	`;

	return (recipients as any[]).map((r) => ({
		cuid: r.cuid,
		notification_cuid: r.notification_cuid,
		employee_cuid: r.employee_cuid,
		read_at: r.read_at,
		created_at: r.created_at,
		title: r.title ?? '',
		body: r.body ?? '',
		category: r.category ?? 'system',
		priority: r.priority ?? 'medium',
		type: r.type ?? 'info',
		metadata: r.metadata ?? null,
		created_by: r.created_by ?? null
	}));
}

/**
 * Counts active notifications for an employee.
 */
export async function countForEmployee(employeeCuid: string, options: ListNotificationsOptions = {}) {
	const whereClause = buildConditions(employeeCuid, options);

	const countResult = await db.$queryRaw`
		SELECT COUNT(*)::int as count
		FROM notification_recipients nr
		JOIN notifications n ON nr.notification_cuid = n.cuid
		WHERE ${whereClause}
	`;

	return Number((countResult as any[])[0]?.count ?? 0);
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

/**
 * Checks if a reminder notification has already been sent to an employee for a specific attendance record.
 */
export async function hasReminderForAttendanceRecord(employeeCuid: string, attendanceRecordCuid: string): Promise<boolean> {
	const matchingNotifications = await db.notification.findMany({
		where: {
			category: 'attendance',
			metadata: {
				path: ['entityCuid'],
				equals: attendanceRecordCuid
			}
		},
		select: {
			cuid: true
		}
	});

	if (matchingNotifications.length === 0) {
		return false;
	}

	const cuids = matchingNotifications.map((n: any) => n.cuid);

	const count = await db.notificationRecipient.count({
		where: {
			employee_cuid: employeeCuid,
			notification_cuid: { in: cuids }
		}
	});

	return count > 0;
}

