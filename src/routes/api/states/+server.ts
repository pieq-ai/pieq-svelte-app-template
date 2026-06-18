import { json } from '@sveltejs/kit';
import { sendList, mapState } from '$lib/server/response.js';
import { getMasterData } from '$lib/server/services/master-data.service.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

export async function GET() {
  try {
    const statesData = await getMasterData('states');
    if (statesData.length === 0) {
      // Find country cuids
      const countries = await getMasterData('countries');
      const india = countries.find(c => c.label === 'India');
      const usa = countries.find(c => c.label === 'United States');
      const uk = countries.find(c => c.label === 'United Kingdom');

      if (india) {
        for (const state of ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu']) {
          await masterDataDao.create('states', { country_cuid: india.id, name: state });
        }
      }

      if (usa) {
        for (const state of ['California', 'Texas', 'New York', 'Florida']) {
          await masterDataDao.create('states', { country_cuid: usa.id, name: state });
        }
      }

      if (uk) {
        for (const state of ['England', 'Scotland', 'Wales', 'Northern Ireland']) {
          await masterDataDao.create('states', { country_cuid: uk.id, name: state });
        }
      }
    }
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
