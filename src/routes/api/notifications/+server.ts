import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as notificationService from '$lib/server/services/notification.service.js';
import { notificationFactory } from '$lib/server/notifications/notification.factory.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { toNotificationDTO } from '$lib/server/utils/mapping.js';
import { ValidationError } from '$lib/server/utils/errors.js';

/**
 * GET /api/notifications
 * List active notifications for the current employee.
 */
export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const email = event.locals.user?.email || '';
		const { employee } = await resolveEmployee(email);
		if (!employee) {
			return json({ error: 'Employee profile not found' }, { status: 404 });
		}

		const url = event.url;
		const page = Number(url.searchParams.get('page') || '1');
		const limit = Number(url.searchParams.get('limit') || '10');
		const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
		const category = url.searchParams.get('category') || undefined;

		const items = await notificationService.getNotificationsForEmployee(employee.cuid, {
			page,
			limit,
			unreadOnly,
			category
		});

		const total = await notificationService.getNotificationsCountForEmployee(employee.cuid, {
			unreadOnly,
			category
		});

		return json({
			data: {
				items: items.map(toNotificationDTO),
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit)
				}
			}
		});
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

/**
 * POST /api/notifications
 * Trigger a broadcast announcement (manual notification).
 */
export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		// In Phase 2, this will be requireAdmin / requireHR
		permissionGuard.requireAdmin(event.locals.user);

		const body = await event.request.json();
		
		// Set creator
		body.created_by = event.locals.user?.id;
		
		// Default to broadcast if not specified
		if (!body.target) {
			body.target = { type: 'broadcast' };
		}

		const notification = await notificationFactory.send(body);

		return json({
			data: {
				cuid: notification?.cuid,
				message: 'Notification sent successfully'
			}
		}, { status: 201 });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
