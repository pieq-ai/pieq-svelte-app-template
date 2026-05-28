import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import {
	createLeaveType,
	getLeaveTypeByUuid,
	listLeaveTypes,
	updateLeaveType,
	LeaveValidationError
} from '$lib/server/services/leave-type.service.js';

export const load: PageServerLoad = async () => {
	try {
		return {
			leaveTypes: await listLeaveTypes()
		};
	} catch (error) {
		console.error('Failed to load leave types:', error);
		return {
			leaveTypes: [],
			error: 'Failed to load leave types from database'
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const leave_name = form.get('leave_name');
		const leave_code = form.get('leave_code');
		const description = form.get('description');
		const is_paid = form.get('is_paid') === 'true' || form.get('is_paid') === 'on';
		const requires_approval = form.get('requires_approval') === 'true' || form.get('requires_approval') === 'on';
		const status = form.get('status') === 'true' || form.get('status') === 'on' || form.get('status') === null ? true : false;

		try {
			const data = await createLeaveType({
				leave_name,
				leave_code,
				description,
				is_paid,
				requires_approval,
				status
			});
			return { success: true, created: data };
		} catch (error) {
			if (error instanceof LeaveValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					action: 'create',
					leave_name: typeof leave_name === 'string' ? leave_name : '',
					leave_code: typeof leave_code === 'string' ? leave_code : '',
					description: typeof description === 'string' ? description : '',
					is_paid,
					requires_approval,
					status
				});
			}

			console.error('Action create leave type failed', error);
			return fail(500, {
				error: 'Failed to create leave type. Please try again.',
				action: 'create'
			});
		}
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');
		const leave_name = form.get('leave_name');
		const leave_code = form.get('leave_code');
		const description = form.get('description');
		const is_paid = form.get('is_paid') === 'true' || form.get('is_paid') === 'on';
		const requires_approval = form.get('requires_approval') === 'true' || form.get('requires_approval') === 'on';
		const status = form.get('status') === 'true' || form.get('status') === 'on';

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Leave type UUID is missing.',
				action: 'update'
			});
		}

		try {
			const data = await updateLeaveType(uuid, {
				leave_name,
				leave_code,
				description,
				is_paid,
				requires_approval,
				status
			});
			return { success: true, updated: data };
		} catch (error) {
			if (error instanceof LeaveValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					action: 'update',
					uuid,
					leave_name: typeof leave_name === 'string' ? leave_name : '',
					leave_code: typeof leave_code === 'string' ? leave_code : '',
					description: typeof description === 'string' ? description : '',
					is_paid,
					requires_approval,
					status
				});
			}

			console.error(`Action update leave type failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to update leave type. Please try again.',
				action: 'update',
				uuid
			});
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Leave type UUID is missing.',
				action: 'delete'
			});
		}

		try {
			const existing = await getLeaveTypeByUuid(uuid);
			if (!existing) {
				return fail(404, {
					error: 'Leave type not found.',
					action: 'delete'
				});
			}

			const updated = await updateLeaveType(uuid, {
				status: !existing.status
			});
			return { success: true, action: 'delete', status: updated.status, updated };
		} catch (error) {
			console.error(`Action delete leave type failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to toggle leave type status. Please try again.',
				action: 'delete',
				uuid
			});
		}
	},

	toggleStatus: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Leave type UUID is missing.',
				action: 'toggleStatus'
			});
		}

		try {
			const existing = await getLeaveTypeByUuid(uuid);
			if (!existing) {
				return fail(404, {
					error: 'Leave type not found.',
					action: 'toggleStatus'
				});
			}

			const updated = await updateLeaveType(uuid, {
				status: !existing.status
			});

			return { success: true, updated };
		} catch (error) {
			console.error(`Action toggleStatus failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to toggle status. Please try again.',
				action: 'toggleStatus',
				uuid
			});
		}
	}
};
