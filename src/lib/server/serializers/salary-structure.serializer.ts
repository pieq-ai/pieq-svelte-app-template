import type {
	SalaryStructure as PrismaSalaryStructure,
	SalaryStructureItem as PrismaSalaryStructureItem
} from '$lib/generated/prisma/client.js';
import type { SalaryStructure, SalaryStructureItem } from '$lib/types/salary-structure.js';

/**
 * Strip the internal BigInt `id` and audit metadata from a PrismaSalaryStructureItem.
 * Converts Decimal `amount` to a plain number for JSON transport.
 */
export function serializeSalaryStructureItem(
	record: PrismaSalaryStructureItem
): SalaryStructureItem {
	return {
		cuid: record.cuid,
		salary_structure_cuid: record.salary_structure_cuid,
		salary_component_cuid: record.salary_component_cuid,
		amount: Number(record.amount)
	};
}

/**
 * Strip the internal BigInt `id` and audit metadata from a PrismaSalaryStructure.
 * Converts Date fields to ISO date strings (YYYY-MM-DD) for JSON transport.
 */
export function serializeSalaryStructure(
	record: PrismaSalaryStructure,
	items: PrismaSalaryStructureItem[]
): SalaryStructure {
	return {
		cuid: record.cuid,
		employee_cuid: record.employee_cuid,
		effective_from: record.effective_from.toISOString().split('T')[0],
		effective_to: record.effective_to
			? record.effective_to.toISOString().split('T')[0]
			: null,
		is_active: record.is_active,
		components: items.map(serializeSalaryStructureItem)
	};
}

/**
 * Serialize a list of salary structures with their items.
 */
export function serializeSalaryStructureList(
	structures: Array<{ structure: PrismaSalaryStructure; items: PrismaSalaryStructureItem[] }>
): SalaryStructure[] {
	return structures.map(({ structure, items }) => serializeSalaryStructure(structure, items));
}
