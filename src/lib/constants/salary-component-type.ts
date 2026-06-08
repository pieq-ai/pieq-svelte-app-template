/**
 * Salary Component Type — frontend-only constant.
 * The DB stores this as a plain VARCHAR; validation is enforced at the application layer.
 */

export const SALARY_COMPONENT_TYPES = ['earning', 'deduction'] as const;

export type SalaryComponentType = (typeof SALARY_COMPONENT_TYPES)[number];

export const SALARY_COMPONENT_TYPE_LABELS: Record<SalaryComponentType, string> = {
	earning: 'Earning',
	deduction: 'Deduction'
};

/**
 * Options array ready for use in select dropdowns / UI components.
 */
export const SALARY_COMPONENT_TYPE_OPTIONS = SALARY_COMPONENT_TYPES.map((value) => ({
	value,
	label: SALARY_COMPONENT_TYPE_LABELS[value]
}));
