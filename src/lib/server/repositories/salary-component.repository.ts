import { db } from '$lib/server/db.js';
import type {
	CreateSalaryComponentDto,
	UpdateSalaryComponentDto,
	SalaryComponentFilters
} from '$lib/types/salary-component.js';
import type { Prisma } from '../../../generated/prisma/client.js';

export async function create(data: CreateSalaryComponentDto) {
	return db.salaryComponent.create({
		data: {
			component_name: data.component_name,
			component_type: data.component_type,
			is_taxable: data.is_taxable ?? false,
			is_active: data.is_active ?? true,
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
			component_name: {
				equals: name,
				mode: 'insensitive'
			}
		}
	});
}

export async function findMany(filters: SalaryComponentFilters) {
	const where: Prisma.SalaryComponentWhereInput = {};

	if (filters.search) {
		where.component_name = {
			contains: filters.search,
			mode: 'insensitive'
		};
	}

	const orderBy: Prisma.SalaryComponentOrderByWithRelationInput = {};
	if (
		filters.sortBy === 'component_name' ||
		filters.sortBy === 'component_type' ||
		filters.sortBy === 'is_active'
	) {
		orderBy[filters.sortBy] = filters.sortOrder ?? 'asc';
	} else {
		orderBy.component_name = 'asc';
	}

	// Only paginate when pageSize is explicitly provided; otherwise fetch all records
	const paginated = filters.pageSize !== undefined;
	const page = Math.max(1, filters.page ?? 1);
	const pageSize = Math.max(1, filters.pageSize ?? 1);

	const [items, total] = await Promise.all([
		db.salaryComponent.findMany({
			where,
			...(paginated && { skip: (page - 1) * pageSize, take: pageSize }),
			orderBy
		}),
		db.salaryComponent.count({ where })
	]);

	return {
		items,
		total,
		page,
		pageSize: filters.pageSize,
		totalPages: paginated ? Math.ceil(total / pageSize) : 1
	};
}
/**
 * Returns aggregate counts for the stats cards.
 * Uses three parallel COUNT queries — no row data is fetched.
 */
export async function getStats() {
	const [total, earningsCount, deductionsCount] = await Promise.all([
		db.salaryComponent.count(),
		db.salaryComponent.count({ where: { component_type: 'earning', is_active: true } }),
		db.salaryComponent.count({ where: { component_type: 'deduction', is_active: true } })
	]);

	return { total, earningsCount, deductionsCount };
}
