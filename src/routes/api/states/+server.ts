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

      const statesToCreate: { country_cuid: string; name: string }[] = [];

      if (india) {
        ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu'].forEach(state => {
          statesToCreate.push({ country_cuid: india.cuid, name: state });
        });
      }

      if (usa) {
        ['California', 'Texas', 'New York', 'Florida'].forEach(state => {
          statesToCreate.push({ country_cuid: usa.cuid, name: state });
        });
      }

      if (uk) {
        ['England', 'Scotland', 'Wales', 'Northern Ireland'].forEach(state => {
          statesToCreate.push({ country_cuid: uk.cuid, name: state });
        });
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
