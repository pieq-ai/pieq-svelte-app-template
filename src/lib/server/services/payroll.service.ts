import * as dao from '$lib/server/dao/payroll.dao.js';
import * as uploadDao from '$lib/server/dao/payroll-upload.dao.js';
import { findEmployeeByCode } from '$lib/server/providers/employee.provider.js';
import { serializePayroll, serializePayrollList } from '$lib/server/serializers/payroll.serializer.js';
import { validatePayrollRow } from '$lib/server/validators/payroll.validator.js';
import type { ParsedPayrollRow } from '$lib/server/utils/excel-parser.js';
import type { PayrollUploadResult } from '$lib/types/payroll.js';

// ─── Custom error classes ─────────────────────────────────────────────────────

export class PayrollNotFoundError extends Error {
	constructor(cuid: string) {
		super(`Payroll record with ID "${cuid}" not found.`);
		this.name = 'PayrollNotFoundError';
	}
}

export class DuplicatePayrollError extends Error {
	constructor(employeeCode: string, month: number, year: number) {
		super(
			`A payroll record for employee "${employeeCode}" for ${year}-${String(month).padStart(2, '0')} already exists.`
		);
		this.name = 'DuplicatePayrollError';
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute gross earnings, total deduction, and net salary from a breakdown.
 *
 * Strategy:
 * 1. If the Excel provides explicit summary columns (gross/total/net), use them.
 * 2. Otherwise, return zeros — the detail page will show the breakdown directly.
 *
 * Note: We do NOT auto-split components into earnings vs deductions here
 * because the breakdown JSON does not carry component type metadata.
 * The summary fields from Excel (if present) are the source of truth.
 */
function computeSummary(
	breakdown: Record<string, number>,
	explicitGross?: number,
	explicitDeduction?: number,
	explicitNet?: number
): { gross_earnings: number; total_deduction: number; net_salary: number } {
	// If all three explicit values are provided, use them directly
	if (
		explicitGross !== undefined &&
		explicitDeduction !== undefined &&
		explicitNet !== undefined
	) {
		return {
			gross_earnings: explicitGross,
			total_deduction: explicitDeduction,
			net_salary: explicitNet
		};
	}

	// If only gross and deduction are provided, compute net
	if (explicitGross !== undefined && explicitDeduction !== undefined) {
		return {
			gross_earnings: explicitGross,
			total_deduction: explicitDeduction,
			net_salary: explicitGross - explicitDeduction
		};
	}

	// If only net is provided, use it for all (no split available)
	if (explicitNet !== undefined) {
		const deduction = explicitDeduction ?? 0;
		const gross = explicitGross ?? explicitNet + deduction;
		return { gross_earnings: gross, total_deduction: deduction, net_salary: explicitNet };
	}

	// Fallback: sum of all breakdown values as gross, no deduction split
	const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
	return { gross_earnings: total, total_deduction: 0, net_salary: total };
}

// ─── Service operations ───────────────────────────────────────────────────────

/**
 * Process a batch of parsed payroll rows from an Excel upload.
 *
 * Steps:
 * 1. Create a PayrollUpload batch record.
 * 2. For each row: validate → match employee → check duplicate → insert.
 * 3. Update the upload's employee_count and status.
 * 4. Return upload summary including the upload_cuid for navigation.
 *
 * Errors are collected and returned — a single bad row does NOT abort the upload.
 *
 * @param rows - Parsed rows from the Excel parser
 * @param month - Pay period month (1-12) used for the upload batch record
 * @param year - Pay period year used for the upload batch record
 * @param created_by - User identifier for audit trail (optional)
 * @returns Upload summary: created, skipped, errors, upload_cuid
 */
export async function uploadPayroll(
	rows: ParsedPayrollRow[],
	month: number,
	year: number,
	created_by?: string | null
): Promise<PayrollUploadResult> {
	// Step 1: Create the PayrollUpload batch record
	const uploadRecord = await uploadDao.create({
		month,
		year,
		status: 'processed',
		created_by: created_by ?? null
	});

	let created = 0;
	let skipped = 0;
	const errors: PayrollUploadResult['errors'] = [];

	for (const row of rows) {
		// Step 2a: Validate row fields
		const { errors: rowErrors, validatedData } = validatePayrollRow(row);
		if (rowErrors.length > 0 || !validatedData) {
			skipped++;
			errors.push(...rowErrors);
			continue;
		}

		// Step 2b: Match employee by code
		const employee = findEmployeeByCode(validatedData.employee_code);
		if (!employee) {
			skipped++;
			errors.push({
				row: row.rowIndex,
				employee_code: validatedData.employee_code,
				reason: `Employee with code "${validatedData.employee_code}" not found. Row skipped.`
			});
			continue;
		}

		// Step 2c: Check for duplicate
		const existing = await dao.findByEmployeeMonthYear(
			employee.cuid,
			validatedData.month,
			validatedData.year
		);
		if (existing) {
			skipped++;
			errors.push({
				row: row.rowIndex,
				employee_code: validatedData.employee_code,
				reason: `Payroll for "${validatedData.employee_code}" for ${validatedData.year}-${String(validatedData.month).padStart(2, '0')} already exists. Row skipped.`
			});
			continue;
		}

		// Step 2d: Compute summary fields
		const { gross_earnings, total_deduction, net_salary } = computeSummary(
			validatedData.components,
			validatedData.gross_earnings,
			validatedData.total_deduction,
			validatedData.net_salary
		);

		// Step 2e: Create payroll record linked to upload batch
		try {
			await dao.create({
				employee_cuid: employee.cuid,
				employee_code: validatedData.employee_code,
				employee_name: validatedData.employee_name || employee.name,
				month: validatedData.month,
				year: validatedData.year,
				gross_earnings,
				total_deduction,
				net_salary,
				payroll_breakdown: validatedData.components,
				payroll_upload_cuid: uploadRecord.cuid,
				created_by: created_by ?? null
			});
			created++;
		} catch (err) {
			// Catch unique constraint violations at DB level as a safety net
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('Unique constraint')) {
				skipped++;
				errors.push({
					row: row.rowIndex,
					employee_code: validatedData.employee_code,
					reason: `Duplicate record detected at database level for ${validatedData.employee_code} (${validatedData.month}/${validatedData.year}).`
				});
			} else {
				skipped++;
				errors.push({
					row: row.rowIndex,
					employee_code: validatedData.employee_code,
					reason: `Failed to create record: ${message}`
				});
			}
		}
	}

	// Step 3: Update upload batch with final count and status
	const status = skipped > 0 && created === 0 ? 'failed' : skipped > 0 ? 'partial' : 'processed';
	await uploadDao.updateEmployeeCount(uploadRecord.cuid, created, status);

	return { created, skipped, errors, upload_cuid: uploadRecord.cuid };
}

/**
 * Retrieve all payroll records.
 */
export async function getPayrolls() {
	const records = await dao.findMany();
	return serializePayrollList(records);
}

/**
 * Retrieve a single payroll record by its external cuid.
 * Throws PayrollNotFoundError if not found.
 */
export async function getPayrollByCuid(cuid: string) {
	const record = await dao.findByCuid(cuid);
	if (!record) {
		throw new PayrollNotFoundError(cuid);
	}
	return serializePayroll(record);
}

/**
 * Retrieve all payroll records belonging to a specific upload batch.
 */
export async function getPayrollsByUploadCuid(uploadCuid: string) {
	const records = await dao.findManyByUploadCuid(uploadCuid);
	return serializePayrollList(records);
}
