import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as notificationService from '$lib/server/services/notification.service.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/**
 * GET /api/notifications/unread-count
 * Fast unread count indicator.
 */
export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const email = event.locals.user?.email || '';
		const { employee } = await resolveEmployee(email);
		if (!employee) {
			return json({ error: 'Employee profile not found' }, { status: 404 });
		}

		const unreadCount = await notificationService.getUnreadCount(employee.cuid);

		return json({
			data: {
				unreadCount
			}
		});
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
