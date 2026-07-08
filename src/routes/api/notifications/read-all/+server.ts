import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as notificationService from '$lib/server/services/notification.service.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for current employee as read.
 */
export async function PATCH(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);

		const email = event.locals.user?.email || '';
		let employee;
		try {
			const resolved = await resolveEmployee(email);
			employee = resolved.employee;
		} catch (err) {
			// Ignore if employee record doesn't exist
		}

		if (!employee) {
			return json({ data: { success: true } });
		}

		await notificationService.markAllAsRead(employee.cuid);

		return json({
			data: {
				success: true,
				message: 'All notifications marked as read'
			}
		});
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
