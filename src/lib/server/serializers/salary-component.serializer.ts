import type { SalaryComponent as PrismaSalaryComponent } from '../../../generated/prisma/client.js';

/**
 * JSON-safe representation of a SalaryComponent exposed to clients.
 * Internal fields (`id`) and audit fields (`created_at`, `created_by`,
 * `updated_at`, `updated_by`) are omitted.
 */
export type SalaryComponentDto = Omit<
	PrismaSalaryComponent,
	'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'
>;

/**
 * Strip the internal BigInt `id` and audit metadata from a Prisma SalaryComponent
 * before sending it across the wire. Clients always identify records by `cuid`.
 */
export function serializeSalaryComponent(record: PrismaSalaryComponent): SalaryComponentDto {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id: _id, created_at: _ca, created_by: _cb, updated_at: _ua, updated_by: _ub, ...rest } = record;
	return rest;
}

/**
 * Serialize a paginated list result that contains SalaryComponent records.
 */
export function serializeSalaryComponentList(result: {
	items: PrismaSalaryComponent[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}) {
	const { items, ...rest } = result;
	return {
		...rest,
		data: items.map(serializeSalaryComponent)
	};
}
