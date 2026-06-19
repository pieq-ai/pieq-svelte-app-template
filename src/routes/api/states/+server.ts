import { json } from '@sveltejs/kit';
import * as masterDataService from '$lib/server/services/master-data.service.js';
import { sendList, mapState } from '$lib/server/response.js';
import { getMasterData } from '$lib/server/services/master-data.service.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

export async function GET() {
  try {
    const listStates = await masterDataService.getStates();
    const mapped = listStates
      .map(mapState)
      .sort((a, b) => a.name.localeCompare(b.name));
    return sendList(mapped);
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
