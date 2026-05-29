import type { SalaryComponent as PrismaSalaryComponent } from '../../../generated/prisma/client.js';

/**
 * JSON-safe representation of a SalaryComponent.
 * The internal BigInt `id` is omitted — clients always use `cuid` as the identifier.
 */
export type SalaryComponentDto = Omit<PrismaSalaryComponent, 'id'>;

/**
 * Strip the internal BigInt `id` from a Prisma SalaryComponent before sending
 * it across the wire. `JSON.stringify` cannot serialize BigInt natively, and
 * the `id` column is an internal surrogate key that should never be exposed to
 * clients — they must always use `cuid`.
 */
export function serializeSalaryComponent(record: PrismaSalaryComponent): SalaryComponentDto {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id: _id, ...rest } = record;
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
	return {
		...result,
		items: result.items.map(serializeSalaryComponent)
	};
}
