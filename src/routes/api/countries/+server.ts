import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { sendList, mapCountry } from '$lib/server/response.js';

export async function GET() {
  try {
    const count = await db.country.count();
    if (count === 0) {
      await db.country.createMany({
        data: [
          { country_name: 'India' },
          { country_name: 'United States' },
          { country_name: 'United Kingdom' }
        ]
      });
    }
    const countries = await db.country.findMany({ orderBy: { country_name: 'asc' } });
    const mapped = countries.map(mapCountry);
    return sendList(mapped);
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
