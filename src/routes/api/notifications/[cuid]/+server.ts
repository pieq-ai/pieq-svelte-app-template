import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as notificationService from '$lib/server/services/notification.service.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

/**
 * DELETE /api/notifications/[cuid]
 * Archive (soft delete) a single notification recipient record.
 */
export async function DELETE(event: RequestEvent) {
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
			return json({ error: 'Employee profile not found' }, { status: 404 });
		}

		const recipientCuid = event.params.cuid;
		if (!recipientCuid) {
			return json({ error: 'Notification CUID is required' }, { status: 400 });
		}

		await notificationService.archiveNotification(employee.cuid, recipientCuid);

		return json({
			data: {
				success: true,
				message: 'Notification archived successfully'
			}
		});
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
