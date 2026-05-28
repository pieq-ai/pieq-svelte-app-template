import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
	createHoliday,
	deleteHoliday,
	HolidayValidationError,
	updateHoliday
} from '$lib/server/services/holiday.service.js';


export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const holiday_name = form.get('holiday_name');
		const holiday_date = form.get('holiday_date');
		const holiday_type = form.get('holiday_type');

		try {
			const holiday = await createHoliday({ holiday_name, holiday_date, holiday_type });
			return { success: true, created: holiday };
		} catch (error) {
			if (error instanceof HolidayValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					action: 'create',
					holiday_name: typeof holiday_name === 'string' ? holiday_name : '',
					holiday_date: typeof holiday_date === 'string' ? holiday_date : '',
					holiday_type: typeof holiday_type === 'string' ? holiday_type : ''
				});
			}

			console.error('POST /holidays?/create failed', error);
			return fail(500, {
				error: 'Failed to create holiday. Please try again.',
				action: 'create',
				holiday_name: typeof holiday_name === 'string' ? holiday_name : '',
				holiday_date: typeof holiday_date === 'string' ? holiday_date : '',
				holiday_type: typeof holiday_type === 'string' ? holiday_type : ''
			});
		}
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');
		const holiday_name = form.get('holiday_name');
		const holiday_date = form.get('holiday_date');
		const holiday_type = form.get('holiday_type');

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Holiday identification (UUID) is missing.',
				action: 'update'
			});
		}

		try {
			const holiday = await updateHoliday(uuid, { holiday_name, holiday_date, holiday_type });
			return { success: true, updated: holiday };
		} catch (error) {
			if (error instanceof HolidayValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					action: 'update',
					uuid,
					holiday_name: typeof holiday_name === 'string' ? holiday_name : '',
					holiday_date: typeof holiday_date === 'string' ? holiday_date : '',
					holiday_type: typeof holiday_type === 'string' ? holiday_type : ''
				});
			}

			console.error(`POST /holidays?/update failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to update holiday. Please try again.',
				action: 'update',
				uuid,
				holiday_name: typeof holiday_name === 'string' ? holiday_name : '',
				holiday_date: typeof holiday_date === 'string' ? holiday_date : '',
				holiday_type: typeof holiday_type === 'string' ? holiday_type : ''
			});
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Holiday identification (UUID) is missing for deletion.',
				action: 'delete'
			});
		}

		try {
			const deleted = await deleteHoliday(uuid);
			return { success: true, deletedUuid: uuid, deleted };
		} catch (error) {
			console.error(`POST /holidays?/delete failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to delete holiday. Please try again.',
				action: 'delete',
				uuid
			});
		}
	}
};
