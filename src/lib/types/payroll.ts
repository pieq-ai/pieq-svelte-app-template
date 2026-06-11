/**
 * Frontend-facing types for the Payroll module.
 * These mirror what the serializer exposes — no BigInt, no audit fields.
 */

// ─── Core types ───────────────────────────────────────────────────────────────

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
	/** ISO timestamp string */
	uploaded_at: string;
	/** ISO timestamp string */
	created_at: string;
}

// ─── DTO types ────────────────────────────────────────────────────────────────

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
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ListPayrollResponse {
	data: Payroll[];
}

export interface PayrollDetailResponse {
	data: Payroll;
}

export interface PayrollUploadResponse {
	data: PayrollUploadResult;
}
