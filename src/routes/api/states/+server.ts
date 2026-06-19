import { json } from '@sveltejs/kit';
import { sendList, mapState } from '$lib/server/response.js';
import { getMasterData } from '$lib/server/services/master-data.service.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

export async function GET() {
  try {
    const states = await getMasterData('states');
    // We mock mapState since getMasterData already returns an option format
    const mapped = states.map(s => ({
       cuid: s.id,
       name: s.label,
       country_cuid: s.meta?.country_cuid || ''
    }));
    return sendList(mapped);
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
