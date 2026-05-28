import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { Actions, PageServerLoad } from './$types.js';
import {
	createLeavePolicy,
	getLeavePolicyByUuid,
	listLeavePolicies,
	updateLeavePolicy
} from '$lib/server/services/leave-policy.service.js';
import { LeaveValidationError } from '$lib/server/services/leave-type.service.js';

export const load: PageServerLoad = async () => {
	try {
		const [policies, leaveTypes, employmentTypes] = await Promise.all([
			listLeavePolicies(),
			db.leaveType.findMany({
				orderBy: { leave_name: 'asc' }
			}),
			db.employmentType.findMany({
				orderBy: { employment_name: 'asc' }
			})
		]);

		return {
			policies,
			leaveTypes,
			employmentTypes
		};
	} catch (error) {
		console.error('Failed to load leave policies load data:', error);
		return {
			policies: [],
			leaveTypes: [],
			employmentTypes: [],
			error: 'Failed to load leave policies'
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const leave_type_id = form.get('leave_type_id');
		const employment_type_ids = form.getAll('employment_type_ids').map(Number);
		const annual_quota = form.get('annual_quota');
		const max_per_month = form.get('max_per_month');
		const carry_forward_allowed = form.get('carry_forward_allowed') === 'true' || form.get('carry_forward_allowed') === 'on';
		const max_carry_forward_days = form.get('max_carry_forward_days');
		const requires_document = form.get('requires_document') === 'true' || form.get('requires_document') === 'on';
		const min_service_days = form.get('min_service_days');
		const allow_half_day = form.get('allow_half_day') === 'true' || form.get('allow_half_day') === 'on';
		const gender_specific = form.get('gender_specific') === 'true' || form.get('gender_specific') === 'on';
		const applicable_gender = form.get('applicable_gender');
		const status = form.get('status') === 'true' || form.get('status') === 'on' || form.get('status') === null ? true : false;

		try {
			const data = await createLeavePolicy({
				leave_type_id,
				employment_type_ids,
				annual_quota,
				max_per_month,
				carry_forward_allowed,
				max_carry_forward_days,
				requires_document,
				min_service_days,
				allow_half_day,
				gender_specific,
				applicable_gender,
				status
			});
			return { success: true, created: data };
		} catch (error) {
			if (error instanceof LeaveValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					action: 'create',
					leave_type_id: typeof leave_type_id === 'string' ? leave_type_id : '',
					employment_type_ids,
					annual_quota: typeof annual_quota === 'string' ? annual_quota : '',
					max_per_month: typeof max_per_month === 'string' ? max_per_month : '',
					carry_forward_allowed,
					max_carry_forward_days: typeof max_carry_forward_days === 'string' ? max_carry_forward_days : '',
					requires_document,
					min_service_days: typeof min_service_days === 'string' ? min_service_days : '',
					allow_half_day,
					gender_specific,
					applicable_gender: typeof applicable_gender === 'string' ? applicable_gender : '',
					status
				});
			}

			console.error('Action create policy failed', error);
			return fail(500, {
				error: 'Failed to create leave policy. Please try again.',
				action: 'create'
			});
		}
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');
		const leave_type_id = form.get('leave_type_id');
		const employment_type_ids = form.getAll('employment_type_ids').map(Number);
		const annual_quota = form.get('annual_quota');
		const max_per_month = form.get('max_per_month');
		const carry_forward_allowed = form.get('carry_forward_allowed') === 'true' || form.get('carry_forward_allowed') === 'on';
		const max_carry_forward_days = form.get('max_carry_forward_days');
		const requires_document = form.get('requires_document') === 'true' || form.get('requires_document') === 'on';
		const min_service_days = form.get('min_service_days');
		const allow_half_day = form.get('allow_half_day') === 'true' || form.get('allow_half_day') === 'on';
		const gender_specific = form.get('gender_specific') === 'true' || form.get('gender_specific') === 'on';
		const applicable_gender = form.get('applicable_gender');
		const status = form.get('status') === 'true' || form.get('status') === 'on';

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Leave policy UUID is missing.',
				action: 'update'
			});
		}

		try {
			const data = await updateLeavePolicy(uuid, {
				leave_type_id,
				employment_type_ids,
				annual_quota,
				max_per_month,
				carry_forward_allowed,
				max_carry_forward_days,
				requires_document,
				min_service_days,
				allow_half_day,
				gender_specific,
				applicable_gender,
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
					leave_type_id: typeof leave_type_id === 'string' ? leave_type_id : '',
					employment_type_ids,
					annual_quota: typeof annual_quota === 'string' ? annual_quota : '',
					max_per_month: typeof max_per_month === 'string' ? max_per_month : '',
					carry_forward_allowed,
					max_carry_forward_days: typeof max_carry_forward_days === 'string' ? max_carry_forward_days : '',
					requires_document,
					min_service_days: typeof min_service_days === 'string' ? min_service_days : '',
					allow_half_day,
					gender_specific,
					applicable_gender: typeof applicable_gender === 'string' ? applicable_gender : '',
					status
				});
			}

			console.error(`Action update policy failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to update leave policy. Please try again.',
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
				error: 'Leave policy UUID is missing.',
				action: 'delete'
			});
		}

		try {
			const existing = await getLeavePolicyByUuid(uuid);
			if (!existing) {
				return fail(404, {
					error: 'Leave policy not found.',
					action: 'delete'
				});
			}

			const updated = await updateLeavePolicy(uuid, {
				status: !existing.status
			});
			return { success: true, action: 'delete', status: updated.status, updated };
		} catch (error) {
			console.error(`Action delete policy failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to toggle leave policy status. Please try again.',
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
				error: 'Leave policy UUID is missing.',
				action: 'toggleStatus'
			});
		}

		try {
			const existing = await getLeavePolicyByUuid(uuid);
			if (!existing) {
				return fail(404, {
					error: 'Leave policy not found.',
					action: 'toggleStatus'
				});
			}

			const updated = await updateLeavePolicy(uuid, {
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
