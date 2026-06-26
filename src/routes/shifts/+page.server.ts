import * as shiftService from '$lib/server/services/shift.service.js';
import { mapShift } from '$lib/server/response.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await shiftService.listAllShifts();
	const shifts = (result.data ?? []).map(mapShift);
	return { shifts };
};
