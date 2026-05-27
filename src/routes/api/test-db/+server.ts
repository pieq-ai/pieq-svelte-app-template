import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function GET() {
	try {
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
