import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

import { createId } from '@paralleldrive/cuid2';

export async function GET() {
	try {
		// Populate Role cuids
		const roles = await (db as any).role.findMany({ where: { cuid: null } });
		for (const r of roles) {
			await (db as any).role.update({
				where: { role_id: r.role_id },
				data: { cuid: createId() }
			});
		}

		// Populate Shift cuids
		const shifts = await (db as any).shift.findMany({ where: { cuid: null } });
		for (const s of shifts) {
			await (db as any).shift.update({
				where: { shift_id: s.shift_id },
				data: { cuid: createId() }
			});
		}

		// Populate CompanyLocation cuids
		const locations = await (db as any).companyLocation.findMany({ where: { cuid: null } });
		for (const loc of locations) {
			await (db as any).companyLocation.update({
				where: { location_id: loc.location_id },
				data: { cuid: createId() }
			});
		}

		const result = {
			bloodGroups: await (db as any).bloodGroup.findMany(),
			nationalities: await (db as any).nationality.findMany(),
			relationTypes: await (db as any).relationType.findMany(),
			departments: await (db as any).department.findMany(),
			roles: await (db as any).role.findMany(),
			designations: await (db as any).designation.findMany(),
			companyLocations: await (db as any).companyLocation.findMany(),
			payGrades: await (db as any).payGrade.findMany(),
			employmentTypes: await (db as any).employmentType.findMany(),
			employees: await (db as any).employee.findMany({ take: 5 }),
			employments: await (db as any).employment.findMany({ take: 5 })
		};
		// Convert BigInt to string for JSON serialization
		const serialized = JSON.parse(
			JSON.stringify(result, (_key, value) =>
				typeof value === 'bigint' ? value.toString() : value
			)
		);
		return json({ data: serialized });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 500 });
	}
}
