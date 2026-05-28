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
			status: data.status ?? 'active'
		}
	});
}

export async function update(id: number, data: UpdateSalaryComponentDto) {
	return db.salaryComponent.update({
		where: { component_id: id },
		data
	});
}

export async function findById(id: number) {
	return db.salaryComponent.findUnique({
		where: { component_id: id }
	});
}

export async function findByNameAndType(name: string, type: 'earning' | 'deduction') {
	return db.salaryComponent.findFirst({
		where: {
			component_name: {
				equals: name,
				mode: 'insensitive'
			},
			component_type: type
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

	if (filters.component_type) {
		where.component_type = filters.component_type;
	}

	if (filters.status) {
		where.status = filters.status;
	}

	const page = Math.max(1, filters.page ?? 1);
	const pageSize = Math.max(1, filters.pageSize ?? 10);
	const skip = (page - 1) * pageSize;

	const orderBy: Prisma.SalaryComponentOrderByWithRelationInput = {};
	if (filters.sortBy === 'component_name' || filters.sortBy === 'component_type' || filters.sortBy === 'status') {
		orderBy[filters.sortBy] = filters.sortOrder ?? 'asc';
	} else {
		orderBy.component_name = 'asc';
	}

	const [items, total] = await Promise.all([
		db.salaryComponent.findMany({
			where,
			skip,
			take: pageSize,
			orderBy
		}),
		db.salaryComponent.count({ where })
	]);

	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize)
	};
}
