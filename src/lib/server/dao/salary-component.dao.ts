import { db } from '$lib/server/db.js';
import type {
	CreateSalaryComponentDto,
	UpdateSalaryComponentDto
} from '$lib/types/salary-component.js';


export async function create(data: CreateSalaryComponentDto) {
	return db.salaryComponent.create({
		data: {
			name: data.name,
			type: data.type,
			is_taxable: data.is_taxable ?? false,
			status: data.status ?? true,
			created_by: data.created_by ?? null
		}
	});
}

/** Update by externally-exposed cuid */
export async function update(cuid: string, data: UpdateSalaryComponentDto) {
	return db.salaryComponent.update({
		where: { cuid },
		data
	});
}

/** Find by externally-exposed cuid */
export async function findByCuid(cuid: string) {
	return db.salaryComponent.findUnique({
		where: { cuid }
	});
}

export async function findByName(name: string) {
	return db.salaryComponent.findFirst({
		where: {
			name: {
				equals: name,
				mode: 'insensitive'
			}
		}
	});
}

export async function findMany() {
	// Search and sorting are fully client-side; always fetch all records with a stable order.
	const [items, total] = await Promise.all([
		db.salaryComponent.findMany({
			orderBy: { name: 'asc' }
		}),
		db.salaryComponent.count()
	]);

	return {
		items,
		total,
		page: 1,
		pageSize: undefined,
		totalPages: 1
	};
}

/**
 * Returns aggregate counts for the stats cards.
 * Uses three parallel COUNT queries — no row data is fetched.
 */
export async function getStats() {
	const [total, earningsCount, deductionsCount] = await Promise.all([
		db.salaryComponent.count(),
		db.salaryComponent.count({ where: { type: 'earning', status: true } }),
		db.salaryComponent.count({ where: { type: 'deduction', status: true } })
	]);

	return { total, earningsCount, deductionsCount };
}
