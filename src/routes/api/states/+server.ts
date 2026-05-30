import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function GET() {
  try {
    const count = await db.state.count();
    if (count === 0) {
      // Find country cuids
      const india = await db.country.findFirst({ where: { country_name: 'India' } });
      const usa = await db.country.findFirst({ where: { country_name: 'United States' } });
      const uk = await db.country.findFirst({ where: { country_name: 'United Kingdom' } });

      const statesToCreate = [];
      if (india) {
        statesToCreate.push(
          { country_cuid: india.cuid, state_name: 'Tamil Nadu' },
          { country_cuid: india.cuid, state_name: 'Karnataka' },
          { country_cuid: india.cuid, state_name: 'Maharashtra' }
        );
      }
      if (usa) {
        statesToCreate.push(
          { country_cuid: usa.cuid, state_name: 'California' },
          { country_cuid: usa.cuid, state_name: 'New York' },
          { country_cuid: usa.cuid, state_name: 'Texas' }
        );
      }
      if (uk) {
        statesToCreate.push(
          { country_cuid: uk.cuid, state_name: 'England' },
          { country_cuid: uk.cuid, state_name: 'Scotland' },
          { country_cuid: uk.cuid, state_name: 'Wales' }
        );
      }
      if (statesToCreate.length > 0) {
        await db.state.createMany({ data: statesToCreate });
      }
    }
    const states = await db.state.findMany({ orderBy: { state_name: 'asc' } });
    return json({ data: states });
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
