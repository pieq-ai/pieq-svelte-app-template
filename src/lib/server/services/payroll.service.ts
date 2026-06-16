import * as dao from '$lib/server/dao/payroll.dao.js';
import * as uploadDao from '$lib/server/dao/payroll-upload.dao.js';
import * as failureDao from '$lib/server/dao/payroll-upload-failure.dao.js';
import { findEmployeeByCode } from '$lib/server/providers/employee.provider.js';
import { serializePayroll, serializePayrollList } from '$lib/server/serializers/payroll.serializer.js';
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

function isNumeric(raw: unknown): boolean {
	if (raw === null || raw === undefined || raw === '') return true;
	if (typeof raw === 'number') return !isNaN(raw);
	const str = String(raw).replace(/,/g, '').trim();
	if (str === '') return true;
	const n = Number(str);
	return !isNaN(n) && isFinite(n);
}

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
 * 2. Perform upload-level validations.
 * 3. For each row: check in-file duplicates → validate → match employee → check duplicate → insert.
 * 4. Update the upload's employee_count and status.
 * 5. Return upload summary including the upload_cuid for navigation.
 *
 * Errors are collected and returned — a single bad row does NOT abort the upload.
 *
 * @param rows - Parsed rows from the Excel parser
 * @param month - Pay period month (1-12) used for the upload batch record
 * @param year - Pay period year used for the upload batch record
 * @param file_name - The original Excel file name
 * @param created_by - User identifier for audit trail (optional)
 * @param options - Upload-level parser metadata
 * @returns Upload summary: created, skipped, errors, upload_cuid
 */
export async function uploadPayroll(
	rows: ParsedPayrollRow[],
	month: number,
	year: number,
	file_name?: string | null,
	created_by?: string | null,
	options?: {
		unreadable?: boolean;
		unreadableError?: string;
		detectedHeaders?: string[];
		columnMapping?: Record<string, string>;
		headerMonth?: number | null;
		headerYear?: number | null;
		headerPeriodStr?: string;
		missingEmpCode?: boolean;
	}
): Promise<PayrollUploadResult> {
	// Step 1: Create the PayrollUpload batch record
	const uploadRecord = await uploadDao.create({
		month,
		year,
		status: 'processed',
		file_name: file_name ?? null,
		created_by: created_by ?? null
	});

	// Check upload-level fail-fast validations
	if (options?.unreadable) {
		const reason = options.unreadableError || 'Unreadable workbook';
		await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', reason);
		return { created: 0, skipped: rows.length, errors: [], upload_cuid: uploadRecord.cuid };
	}

	if (rows.length === 0) {
		await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', 'Empty workbook');
		return { created: 0, skipped: 0, errors: [], upload_cuid: uploadRecord.cuid };
	}

	if (options) {
		if (options.missingEmpCode) {
			await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', "Required column 'Emp No' is missing.");
			return { created: 0, skipped: rows.length, errors: [], upload_cuid: uploadRecord.cuid };
		}

		if (options.headerMonth === null || options.headerYear === null || options.headerMonth === undefined || options.headerYear === undefined) {
			await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', 'Payroll period could not be extracted from the report header.');
			return { created: 0, skipped: rows.length, errors: [], upload_cuid: uploadRecord.cuid };
		}

		if (options.headerMonth !== month || options.headerYear !== year) {
			await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', 'Selected payroll period does not match uploaded file period.');
			return { created: 0, skipped: rows.length, errors: [], upload_cuid: uploadRecord.cuid };
		}
	}

	let created = 0;
	let skipped = 0;
	const errors: PayrollUploadResult['errors'] = [];
	const seenKeys = new Set<string>();

	for (const row of rows) {
		// Duplicate Row Check (within the file itself)
		const empCodeTrimmed = (row.employee_code || '').trim().toUpperCase();
		if (empCodeTrimmed && row.month !== null && row.year !== null) {
			const duplicateKey = `${empCodeTrimmed}_${row.month}_${row.year}`;
			if (seenKeys.has(duplicateKey)) {
				skipped++;
				const errorMessage = 'Duplicate row in upload';
				errors.push({
					row: row.rowIndex,
					employee_code: row.employee_code,
					reason: errorMessage
				});
				await failureDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: row.rowIndex,
					employee_code: row.employee_code || null,
					error_type: 'Duplicate Row',
					error_message: errorMessage
				});
				continue;
			}
			seenKeys.add(duplicateKey);
		}

		// Validation order:
		// 1. Employee Code exists.
		const empCode = (row.employee_code || '').trim();
		if (!empCode) {
			skipped++;
			const reason = 'Employee code is required';
			errors.push({
				row: row.rowIndex,
				employee_code: '(empty)',
				reason
			});
			await failureDao.create({
				payroll_upload_cuid: uploadRecord.cuid,
				row_number: row.rowIndex,
				employee_code: null,
				error_type: 'Missing Employee Code',
				error_message: reason
			});
			continue;
		}

		// 2. Employee exists.
		const employee = findEmployeeByCode(empCode);
		if (!employee) {
			skipped++;
			const errorMessage = `Employee with code ${empCode} does not exist (not found)`;
			errors.push({
				row: row.rowIndex,
				employee_code: empCode,
				reason: errorMessage
			});
			await failureDao.create({
				payroll_upload_cuid: uploadRecord.cuid,
				row_number: row.rowIndex,
				employee_code: empCode,
				error_type: 'Employee Not Found',
				error_message: errorMessage
			});
			continue;
		}

		// (Check if month and year are valid before duplicate DB check)
		if (row.month === null || row.month === undefined) {
			skipped++;
			const reason = 'Month is missing or cannot be parsed.';
			errors.push({
				row: row.rowIndex,
				employee_code: empCode,
				reason
			});
			await failureDao.create({
				payroll_upload_cuid: uploadRecord.cuid,
				row_number: row.rowIndex,
				employee_code: empCode,
				error_type: 'Validation Error',
				error_message: reason
			});
			continue;
		}
		if (row.month < 1 || row.month > 12) {
			skipped++;
			const reason = `Month value ${row.month} is out of range (must be 1-12).`;
			errors.push({
				row: row.rowIndex,
				employee_code: empCode,
				reason
			});
			await failureDao.create({
				payroll_upload_cuid: uploadRecord.cuid,
				row_number: row.rowIndex,
				employee_code: empCode,
				error_type: 'Validation Error',
				error_message: reason
			});
			continue;
		}
		if (row.year === null || row.year === undefined) {
			skipped++;
			const reason = 'Year is missing or cannot be parsed.';
			errors.push({
				row: row.rowIndex,
				employee_code: empCode,
				reason
			});
			await failureDao.create({
				payroll_upload_cuid: uploadRecord.cuid,
				row_number: row.rowIndex,
				employee_code: empCode,
				error_type: 'Validation Error',
				error_message: reason
			});
			continue;
		}
		if (row.year < 2000 || row.year > 9999) {
			skipped++;
			const reason = `Year value ${row.year} is not a valid 4-digit year.`;
			errors.push({
				row: row.rowIndex,
				employee_code: empCode,
				reason
			});
			await failureDao.create({
				payroll_upload_cuid: uploadRecord.cuid,
				row_number: row.rowIndex,
				employee_code: empCode,
				error_type: 'Validation Error',
				error_message: reason
			});
			continue;
		}

		// 3. Payroll does not already exist for Employee + Month + Year.
		const existing = await dao.findByEmployeeMonthYear(
			employee.cuid,
			row.month,
			row.year
		);
		if (existing) {
			skipped++;
			const errorMessage = 'Payroll already exists';
			errors.push({
				row: row.rowIndex,
				employee_code: empCode,
				reason: errorMessage
			});
			await failureDao.create({
				payroll_upload_cuid: uploadRecord.cuid,
				row_number: row.rowIndex,
				employee_code: empCode,
				error_type: 'Duplicate Payroll',
				error_message: errorMessage
			});
			continue;
		}

		// 4. Any populated salary component value is numeric.
		let hasComponentError = false;
		if (row.rawComponents) {
			for (const [componentName, rawValue] of Object.entries(row.rawComponents)) {
				if (!isNumeric(rawValue)) {
					skipped++;
					hasComponentError = true;
					const reason = `${componentName} must be numeric.`;
					errors.push({
						row: row.rowIndex,
						employee_code: empCode,
						reason
					});
					await failureDao.create({
						payroll_upload_cuid: uploadRecord.cuid,
						row_number: row.rowIndex,
						employee_code: empCode,
						error_type: 'Validation Error',
						error_message: reason
					});
					break;
				}
			}
		}
		if (hasComponentError) {
			continue;
		}

		// 5. Payroll record creation succeeds.
		const { gross_earnings, total_deduction, net_salary } = computeSummary(
			row.components,
			row.gross_earnings,
			row.total_deduction,
			row.net_salary
		);

		try {
			await dao.create({
				employee_cuid: employee.cuid,
				employee_code: empCode,
				employee_name: row.employee_name.trim() || employee.name,
				month: row.month,
				year: row.year,
				gross_earnings,
				total_deduction,
				net_salary,
				breakdown: row.components,
				payroll_upload_cuid: uploadRecord.cuid,
				created_by: created_by ?? null
			});
			created++;
		} catch (err) {
			// Catch unique constraint violations at DB level as a safety net
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('Unique constraint')) {
				skipped++;
				const errorMessage = 'Payroll already exists';
				errors.push({
					row: row.rowIndex,
					employee_code: empCode,
					reason: errorMessage
				});
				await failureDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: row.rowIndex,
					employee_code: empCode,
					error_type: 'Duplicate Payroll',
					error_message: errorMessage
				});
			} else {
				skipped++;
				errors.push({
					row: row.rowIndex,
					employee_code: empCode,
					reason: message
				});
				await failureDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: row.rowIndex,
					employee_code: empCode,
					error_type: 'Database Error',
					error_message: message
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
