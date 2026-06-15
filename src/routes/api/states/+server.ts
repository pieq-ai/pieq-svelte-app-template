import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { sendList, mapState } from '$lib/server/response.js';

export async function GET() {
  try {
    const count = await db.state.count();
    if (count === 0) {
      // Find country cuids
      const india = await db.country.findFirst({ where: { name: 'India' } });
      const usa = await db.country.findFirst({ where: { name: 'United States' } });
      const uk = await db.country.findFirst({ where: { name: 'United Kingdom' } });

      const statesToCreate = [];
      if (india) {
        statesToCreate.push(
          { country_cuid: india.cuid, name: 'Tamil Nadu' },
          { country_cuid: india.cuid, name: 'Karnataka' },
          { country_cuid: india.cuid, name: 'Maharashtra' }
        );
      }
      if (usa) {
        statesToCreate.push(
          { country_cuid: usa.cuid, name: 'California' },
          { country_cuid: usa.cuid, name: 'New York' },
          { country_cuid: usa.cuid, name: 'Texas' }
        );
      }
      if (uk) {
        statesToCreate.push(
          { country_cuid: uk.cuid, name: 'England' },
          { country_cuid: uk.cuid, name: 'Scotland' },
          { country_cuid: uk.cuid, name: 'Wales' }
        );
      }
      if (statesToCreate.length > 0) {
        await db.state.createMany({ data: statesToCreate });
      }
    }
    const states = await db.state.findMany({ orderBy: { name: 'asc' } });
    const mapped = states.map(mapState);
    return sendList(mapped);
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
