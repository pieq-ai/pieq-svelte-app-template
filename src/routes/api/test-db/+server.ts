import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

import { createId } from '@paralleldrive/cuid2';

export async function GET() {
	try {
		// Populate Role cuids
		const roles = await db.role.findMany({ where: { cuid: null } });
		for (const r of roles) {
			await db.role.update({
				where: { role_id: r.role_id },
				data: { cuid: createId() }
			});
		}

		// Populate Shift cuids
		const shifts = await db.shift.findMany({ where: { cuid: null } });
		for (const s of shifts) {
			await db.shift.update({
				where: { shift_id: s.shift_id },
				data: { cuid: createId() }
			});
		}

		// Populate CompanyLocation cuids
		const locations = await db.companyLocation.findMany({ where: { cuid: null } });
		for (const loc of locations) {
			await db.companyLocation.update({
				where: { location_id: loc.location_id },
				data: { cuid: createId() }
			});
		}

		const result = {
			bloodGroups: await db.bloodGroup.findMany(),
			nationalities: await db.nationality.findMany(),
			relationTypes: await db.relationType.findMany(),
			departments: await db.department.findMany(),
			roles: await db.role.findMany(),
			designations: await db.designation.findMany(),
			companyLocations: await db.companyLocation.findMany(),
			payGrades: await db.payGrade.findMany(),
			employmentTypes: await db.employmentType.findMany(),
			employees: await db.employee.findMany({ take: 5 }),
			employments: await db.employment.findMany({ take: 5 })
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
