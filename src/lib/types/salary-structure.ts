/**
 * Frontend-facing types for the Salary Structure module.
 * These mirror what the serializer exposes — no BigInt, no audit fields.
 */

// ─── Item-level types ────────────────────────────────────────────────────────

export interface SalaryStructureItem {
	cuid: string;
	salary_structure_cuid: string;
	salary_component_cuid: string;
	/** Component name captured at assignment time; stable even if component is later renamed. */
	component_name_snapshot: string;
	/** Stored as Decimal in DB; serialised as number for JSON transport */
	amount: number;
}

// ─── Structure-level types ────────────────────────────────────────────────────

export interface SalaryStructure {
	cuid: string;
	employee_cuid: string;
	/** ISO date string (YYYY-MM-DD) */
	effective_from: string;
	/** ISO date string or null */
	effective_to: string | null;
	status: boolean;
	is_active: boolean;
	components: SalaryStructureItem[];
}

// ─── DTO types (used by service + DAO) ───────────────────────────────────────

export interface CreateSalaryStructureItemDto {
	salary_component_cuid: string;
	amount: number;
	created_by?: string | null;
}

export interface CreateSalaryStructureDto {
	employee_cuid: string;
	effective_from: string;
	effective_to?: string | null;
	status?: boolean;
	/** Renamed from `items` — the external API payload key is `components` */
	components: CreateSalaryStructureItemDto[];
	created_by?: string | null;
	confirmAdjustment?: boolean;
}

export interface UpdateSalaryStructureItemDto {
	salary_component_cuid: string;
	amount: number;
}

export interface UpdateSalaryStructureDto {
	employee_cuid?: string;
	effective_from?: string;
	effective_to?: string | null;
	status?: boolean;
	/** Renamed from `items` — the external API payload key is `components` */
	components?: UpdateSalaryStructureItemDto[];
	updated_by?: string | null;
	confirmAdjustment?: boolean;
}

/**
 * DTO for creating a salary revision.
 * The employee is inferred from the source structure — only the new effective_from
 * and updated component assignments are required.
 */
export interface CreateRevisionDto {
	effective_from: string;
	components: Array<{
		salary_component_cuid: string;
		amount: number;
	}>;
	created_by?: string | null;
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ListSalaryStructureResponse {
	data: SalaryStructure[];
}

export interface MutationSalaryStructureResponse {
	data: { cuid: string; message: string };
}

export interface DeleteSalaryStructureResponse {
	data: { message: string };
}
