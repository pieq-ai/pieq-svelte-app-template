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
		permissionGuard.requirePermission(event.locals.user, 'dashboard:view');

		const email = event.locals.user?.email || '';
		let employee;
		try {
			const resolved = await resolveEmployee(email);
			employee = resolved.employee;
		} catch (err) {
			// Ignore if employee record doesn't exist
		}

		if (!employee) {
			return json({ data: { unreadCount: 0 } });
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
