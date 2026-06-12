/**
 * Frontend-facing types for the Payroll module.
 * These mirror what the serializer exposes — no BigInt, no audit fields.
 */

// ─── Core types ───────────────────────────────────────────────────────────────

/** Represents one uploaded payroll file — the top-level entity. */
export interface PayrollUpload {
	cuid: string;
	/** 1-12 */
	month: number;
	/** 4-digit year e.g. 2026 */
	year: number;
	/** Number of employee payroll records successfully created */
	employee_count: number;
	/** 'processed' | 'partial' */
	status: string;
	/** ISO timestamp string */
	uploaded_at: string;
	/** ISO timestamp string */
	created_at: string;
}

export interface Payroll {
	cuid: string;
	employee_cuid: string;
	employee_code: string;
	employee_name: string;
	/** 1-12 */
	month: number;
	/** 4-digit year e.g. 2026 */
	year: number;
	gross_earnings: number;
	total_deduction: number;
	net_salary: number;
	/** Flat JSON: { "Basic": 30000, "HRA": 12000, "PF": 1800 } */
	payroll_breakdown: Record<string, number>;
	/** CUID of the parent PayrollUpload batch (null for legacy records) */
	payroll_upload_cuid: string | null;
	/** ISO timestamp string */
	uploaded_at: string;
	/** ISO timestamp string */
	created_at: string;
}

// ─── DTO types ────────────────────────────────────────────────────────────────

export interface CreatePayrollUploadDto {
	month: number;
	year: number;
	status?: string;
	created_by?: string | null;
}

export interface CreatePayrollDto {
	employee_cuid: string;
	employee_code: string;
	employee_name: string;
	month: number;
	year: number;
	gross_earnings: number;
	total_deduction: number;
	net_salary: number;
	payroll_breakdown: Record<string, number>;
	payroll_upload_cuid?: string | null;
	created_by?: string | null;
}

// ─── Upload result types ──────────────────────────────────────────────────────

export interface PayrollUploadError {
	row: number;
	employee_code: string;
	reason: string;
}

export interface PayrollUploadResult {
	created: number;
	skipped: number;
	errors: PayrollUploadError[];
	/** CUID of the PayrollUpload batch record that was created */
	upload_cuid: string;
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ListPayrollUploadResponse {
	data: PayrollUpload[];
}

export interface PayrollUploadDetailResponse {
	data: PayrollUpload;
}

export interface ListPayrollResponse {
	data: Payroll[];
}

export interface PayrollDetailResponse {
	data: Payroll;
}

export interface PayrollUploadResponse {
	data: PayrollUploadResult;
}
