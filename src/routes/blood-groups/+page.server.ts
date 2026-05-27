import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createBloodGroup,
	deleteBloodGroup,
	BloodGroupValidationError,
	listBloodGroups,
	updateBloodGroup
} from '$lib/server/services/blood-group.service.js';

export const load: PageServerLoad = async () => {
	try {
		return {
			bloodGroups: await listBloodGroups()
		};
	} catch (error) {
		console.error('Failed to load blood groups:', error);
		return {
			bloodGroups: [],
			error: 'Failed to load blood groups from database'
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const blood_group_name = form.get('blood_group_name');

		try {
			const group = await createBloodGroup({ blood_group_name });
			return { success: true, created: group };
		} catch (error) {
			if (error instanceof BloodGroupValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					action: 'create',
					blood_group_name: typeof blood_group_name === 'string' ? blood_group_name : ''
				});
			}

			console.error('POST /blood-groups?/create failed', error);
			return fail(500, {
				error: 'Failed to create blood group. Please try again.',
				action: 'create',
				blood_group_name: typeof blood_group_name === 'string' ? blood_group_name : ''
			});
		}
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');
		const blood_group_name = form.get('blood_group_name');

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Blood Group identification (UUID) is missing.',
				action: 'update'
			});
		}

		try {
			const group = await updateBloodGroup(uuid, { blood_group_name });
			return { success: true, updated: group };
		} catch (error) {
			if (error instanceof BloodGroupValidationError) {
				return fail(400, {
					error: error.message,
					field: error.field,
					action: 'update',
					uuid,
					blood_group_name: typeof blood_group_name === 'string' ? blood_group_name : ''
				});
			}

			console.error(`POST /blood-groups?/update failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to update blood group. Please try again.',
				action: 'update',
				uuid,
				blood_group_name: typeof blood_group_name === 'string' ? blood_group_name : ''
			});
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const uuid = form.get('uuid');

		if (typeof uuid !== 'string' || !uuid) {
			return fail(400, {
				error: 'Blood Group identification (UUID) is missing for deletion.',
				action: 'delete'
			});
		}

		try {
			const deleted = await deleteBloodGroup(uuid);
			return { success: true, deletedUuid: uuid, deleted };
		} catch (error) {
			console.error(`POST /blood-groups?/delete failed for ${uuid}`, error);
			return fail(500, {
				error: 'Failed to delete blood group. Please try again.',
				action: 'delete',
				uuid
			});
		}
	}
};
