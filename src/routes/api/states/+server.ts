import { json } from '@sveltejs/kit';
import * as masterDataService from '$lib/server/services/master-data.service.js';
import { sendList, mapState } from '$lib/server/response.js';
import { getMasterData } from '$lib/server/services/master-data.service.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

import { requirePermission } from '$lib/server/guards/permission.guard.js';

export async function GET({ locals }: { locals: App.Locals }) {
  try {
    requirePermission(locals.user, 'dashboard:view');
    const listStates = await masterDataService.getStates();
    const mapped = listStates
      .map(mapState)
      .sort((a, b) => a.name.localeCompare(b.name));
    return sendList(mapped);
  } catch (err: any) {
    return json({ error: err.body?.message || err.message }, { status: 500 });
  }
}
