import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as notificationService from '$lib/server/services/notification.service.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { toNotificationDTO } from '$lib/server/utils/mapping.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/');
	}

	permissionGuard.requireAuth(locals.user);

	const email = locals.user.email || '';
	const { employee } = await resolveEmployee(email);
	if (!employee) {
		return {
			error: 'Employee profile not found',
			notifications: [],
			pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
		};
	}

	const page = Number(url.searchParams.get('page') || '1');
	const limit = Number(url.searchParams.get('limit') || '10');
	const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
	const category = url.searchParams.get('category') || undefined;
	const search = url.searchParams.get('search') || undefined;

	const items = await notificationService.getNotificationsForEmployee(employee.cuid, {
		page,
		limit,
		unreadOnly,
		category,
		search
	});

	const total = await notificationService.getNotificationsCountForEmployee(employee.cuid, {
		unreadOnly,
		category,
		search
	});

	return {
		notifications: items.map(toNotificationDTO),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		},
		filters: {
			category: category || '',
			unreadOnly,
			search: search || ''
		}
	};
};
