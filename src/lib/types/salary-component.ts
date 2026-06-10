import type { SalaryComponentDto } from '$lib/server/serializers/salary-component.serializer.js';

// component_type is enforced at the application layer only (no DB enum)
export type SalaryComponentType = 'earning' | 'deduction';

export interface SalaryComponent {
	/** Surrogate auto-incrementing primary key (internal use only) */
	id: bigint;

	/** Externally-exposed non-guessable identifier — used in all API routes */
	cuid: string;

	component_name: string;
	component_type: SalaryComponentType;

	is_taxable: boolean;
	status: boolean;

	created_at: Date;
	/** cuid of the user who created this record */
	created_by: string | null;

	updated_at: Date;
	/** cuid of the user who last updated this record */
	updated_by: string | null;
}

export interface CreateSalaryComponentDto {
	component_name: string;
	component_type: SalaryComponentType;
	is_taxable?: boolean;
	status?: boolean;
	/** cuid of the authenticated user performing the action */
	created_by?: string | null;
}

export interface UpdateSalaryComponentDto {
	component_name?: string;
	component_type?: SalaryComponentType;
	is_taxable?: boolean;
	status?: boolean;
	/** cuid of the authenticated user performing the action */
	updated_by?: string | null;
}

export interface SalaryComponentFilters {
	search?: string;
	page?: number;
	pageSize?: number;
	sortBy?: 'component_name' | 'component_type' | 'status';
	sortOrder?: 'asc' | 'desc';
}

export interface ListSalaryComponentResponse {
	data: SalaryComponentDto[];
}

export interface MutationSalaryComponentResponse {
	data: { cuid: string; message: string };
}

export interface DeleteSalaryComponentResponse {
	data: { message: string };
}
