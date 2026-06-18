import { json } from '@sveltejs/kit';
import { sendList, mapCountry } from '$lib/server/response.js';
import { getMasterData } from '$lib/server/services/master-data.service.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

export async function GET() {
  try {
    const countriesData = await getMasterData('countries');
    if (countriesData.length === 0) {
      for (const country of ['India', 'United States', 'United Kingdom']) {
        await masterDataDao.create('countries', { name: country });
      }
    }
    const countries = await getMasterData('countries');
    // We mock mapCountry since getMasterData already returns an option format
    const mapped = countries.map(c => ({
       cuid: c.id,
       name: c.label
    }));
    return sendList(mapped);
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
