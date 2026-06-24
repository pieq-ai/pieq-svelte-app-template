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
	success_count: number;
	/** Number of employee payroll records that failed to load */
	failure_count: number;
	/** 'processed' | 'partial' */
	status: string;
	/** The original name of the uploaded Excel file */
	file_name: string | null;
	/** High-level errors if the upload-level validation failed */
	errors: string | null;
	/** ISO timestamp string */
	uploaded_at: string;
}

export interface PayrollEmployeeDetails {
	/** Designation name from designations table */
	designation: string | null;
	/** Location name from company_locations table */
	location: string | null;
	/** Date of joining (ISO date string "YYYY-MM-DD"), or null */
	date_of_joining: string | null;
	/** Bank name from primary bank_details record */
	bank_name: string | null;
	/** Account number from primary bank_details record (also used as PF Account No.) */
	bank_account_number: string | null;
	/** PAN from employees table */
	pan: string | null;
	/** ESI number from employees table */
	pf_account_number: string | null;
	/** UAN from employees table */
	uan: string | null;
	/** Paid days extracted from the breakdown JSON, or null if not present */
	paid_days: string | null;
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
	breakdown: Record<string, number>;
	/** CUID of the parent PayrollUpload batch (null for legacy records) */
	payroll_upload_cuid: string | null;
	/** ISO timestamp string */
	uploaded_at: string;
	/** Employee master details fetched at payslip time (optional — may be absent on list views) */
	employee_details?: PayrollEmployeeDetails;
}

// ─── DTO types ────────────────────────────────────────────────────────────────

export interface CreatePayrollUploadDto {
	month: number;
	year: number;
	status?: string;
	file_name?: string | null;
	errors?: string | null;
	created_by?: string | null;
}

export interface CreatePayrollDto {
	employee_cuid: string;
	month: number;
	year: number;
	gross_earnings: number;
	total_deduction: number;
	net_salary: number;
	breakdown: Record<string, number>;
	payroll_upload_cuid?: string | null;
	created_by?: string | null;
}

// ─── Upload result types ──────────────────────────────────────────────────────

export interface PayrollUploadError {
	row: number;
	employee_code: string;
	reason: string;
}

export interface PayrollUploadFailure {
	cuid: string;
	payroll_upload_cuid: string;
	row_number: number;
	employee_code: string | null;
	error_type: string;
	error_message: string;
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
	data: PayrollUpload & {
		records: Payroll[];
		failures: PayrollUploadFailure[];
	};
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

export type PayrollOrFailure = 
	| (Payroll & { isFailure?: false; status?: never; error_type?: never; error_message?: never; row_number?: never })
	| (PayrollUploadFailure & { isFailure: true; status: 'Failed'; employee_name?: never; gross_earnings?: never; total_deduction?: never; net_salary?: never; breakdown?: never });
