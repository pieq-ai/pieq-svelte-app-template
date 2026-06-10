import { db } from '$lib/server/db.js';
import type {
	CreateSalaryStructureDto,
	UpdateSalaryStructureDto
} from '$lib/types/salary-structure.js';

// ─── Structure queries ────────────────────────────────────────────────────────

/** Create a new salary structure record (without items). */
export async function create(data: Omit<CreateSalaryStructureDto, 'components'>) {
	return db.salaryStructure.create({
		data: {
			employee_cuid: data.employee_cuid,
			effective_from: new Date(data.effective_from),
			effective_to: data.effective_to ? new Date(data.effective_to) : null,
			status: data.status ?? true,
			created_by: data.created_by ?? null
		}
	});
}

/** Update a salary structure by its external cuid. */
export async function update(cuid: string, data: Omit<UpdateSalaryStructureDto, 'components'>) {
	return db.salaryStructure.update({
		where: { cuid },
		data: {
			...(data.employee_cuid !== undefined && { employee_cuid: data.employee_cuid }),
			...(data.effective_from !== undefined && { effective_from: new Date(data.effective_from) }),
			...('effective_to' in data && {
				effective_to: data.effective_to ? new Date(data.effective_to) : null
			}),
			...(data.status !== undefined && { status: data.status }),
			updated_by: data.updated_by ?? null
		}
	});
}

/** Find a salary structure by its external cuid. */
export async function findByCuid(cuid: string) {
	return db.salaryStructure.findUnique({ where: { cuid } });
}

/** Find a salary structure by employee cuid. */
export async function findByEmployeeCuid(employee_cuid: string) {
	return db.salaryStructure.findFirst({
		where: { employee_cuid }
	});
}

/** Fetch all salary structures with stable ordering. */
export async function findMany() {
	return db.salaryStructure.findMany({
		orderBy: { effective_from: 'desc' }
	});
}

// ─── Item queries ─────────────────────────────────────────────────────────────

/** Create multiple item rows for a given salary structure. */
export async function createItems(
	salary_structure_cuid: string,
	items: Array<{ salary_component_cuid: string; amount: number; created_by?: string | null }>
) {
	// createMany is not supported with Prisma Postgres adapter, so we batch individually
	return Promise.all(
		items.map((item) =>
			db.salaryStructureItem.create({
				data: {
					salary_structure_cuid,
					salary_component_cuid: item.salary_component_cuid,
					amount: item.amount,
					created_by: item.created_by ?? null
				}
			})
		)
	);
}

/** Delete all items belonging to a salary structure (used during update). */
export async function deleteItemsByStructureCuid(salary_structure_cuid: string) {
	return db.salaryStructureItem.deleteMany({
		where: { salary_structure_cuid }
	});
}

/** Fetch all items for a given salary structure cuid. */
export async function findItemsByStructureCuid(salary_structure_cuid: string) {
	return db.salaryStructureItem.findMany({
		where: { salary_structure_cuid },
		orderBy: { cuid: 'asc' }
	});
}

/** Fetch items for multiple structure cuids in one query. */
export async function findItemsByStructureCuids(salary_structure_cuids: string[]) {
	return db.salaryStructureItem.findMany({
		where: { salary_structure_cuid: { in: salary_structure_cuids } },
		orderBy: { cuid: 'asc' }
	});
}
