export type SalaryComponentType = 'earning' | 'deduction';
export type MasterStatus = 'active' | 'inactive';

export interface SalaryComponent {
	component_id: number;
	component_name: string;
	component_type: SalaryComponentType;
	is_taxable: boolean;
	status: MasterStatus;
}

export interface CreateSalaryComponentDto {
	component_name: string;
	component_type: SalaryComponentType;
	is_taxable?: boolean;
	status?: MasterStatus;
}

export interface UpdateSalaryComponentDto {
	component_name?: string;
	component_type?: SalaryComponentType;
	is_taxable?: boolean;
	status?: MasterStatus;
}

export interface SalaryComponentFilters {
	search?: string;
	component_type?: SalaryComponentType;
	status?: MasterStatus;
	page?: number;
	pageSize?: number;
	sortBy?: 'component_name' | 'component_type' | 'status';
	sortOrder?: 'asc' | 'desc';
}

export interface SalaryComponentResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
}
