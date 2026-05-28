export type SalaryComponentType = 'earning' | 'deduction';

export interface SalaryComponent {
	id: string;
	component_name: string;
	component_type: SalaryComponentType;
	is_taxable: boolean;
	is_active: boolean;
}

export interface CreateSalaryComponentDto {
	component_name: string;
	component_type: SalaryComponentType;
	is_taxable?: boolean;
	is_active?: boolean;
}

export interface UpdateSalaryComponentDto {
	component_name?: string;
	component_type?: SalaryComponentType;
	is_taxable?: boolean;
	is_active?: boolean;
}

export interface SalaryComponentFilters {
	search?: string;
	component_type?: SalaryComponentType;
	is_active?: boolean;
	page?: number;
	pageSize?: number;
	sortBy?: 'component_name' | 'component_type' | 'is_active';
	sortOrder?: 'asc' | 'desc';
}

export interface SalaryComponentResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
}
