import * as dao from '$lib/server/dao/payroll.dao.js';
import { notificationFactory } from '$lib/server/notifications/notification.factory.js';
import * as uploadDao from '$lib/server/dao/payroll-upload.dao.js';
import * as recordDao from '$lib/server/dao/payroll-upload-record.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import * as bankDetailDao from '$lib/server/dao/bank-detail.dao.js';
import * as designationDao from '$lib/server/dao/designation.dao.js';
import * as locationDao from '$lib/server/dao/organization_location.dao.js';
import { db } from '$lib/server/db.js';
import * as auditService from '$lib/server/services/audit.service.js';
import { findEmployeeByCode } from '$lib/server/providers/employee.provider.js';
import { getEarningsAndDeductions, numberToWords } from '$lib/utils/payroll.js';
import { getMonthlyUsedDays } from '$lib/server/services/leave.service.js';
import { serializePayroll, serializePayrollList } from '$lib/server/serializers/payroll.serializer.js';
import type { ParsedPayrollRow } from '$lib/server/utils/excel-parser.js';
import type { PayrollUploadResult } from '$lib/types/payroll.js';
import type { PayrollEmployeeDetails } from '$lib/types/payroll.js';
import { Prisma } from '$lib/generated/prisma/client.js';
import { validatePayrollRow } from '$lib/server/validators/payroll.validator.js';

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

/**
 * Compute gross earnings, total deduction, and net salary from a breakdown.
 *
 * Strategy:
 * 1. If the Excel provides explicit summary columns (gross/total/net), use them.
 * 2. Otherwise, return zeros â€” the detail page will show the breakdown directly.
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

/**
 * Process a batch of parsed payroll rows from an Excel upload.
 *
 * Steps:
 * 1. Create a PayrollUpload batch record.
 * 2. Perform upload-level validations.
 * 3. For each row: check in-file duplicates validate match employee check duplicate insert.
 * 4. Update the upload's employee_count and status.
 * 5. Return upload summary including the upload_cuid for navigation.
 *
 * Errors are collected and returned - a single bad row does NOT abort the upload.
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
	return db.$transaction(async (tx) => {
		// Step 1: Create the PayrollUpload batch record
		const uploadRecord = await uploadDao.create({
			month,
			year,
			status: 'processed',
			file_name: file_name ?? null,
			created_by: created_by ?? null
		}, tx);

		// Log start of payroll upload bulk operation
		await auditService.log({
			entity_name: 'PayrollUpload',
			entity_cuid: uploadRecord.cuid,
			action_type: 'bulk_upload_start',
			status: 'SUCCESS',
		}, tx);

		// Check upload-level fail-fast validations
		if (options?.unreadable) {
			const reason = options.unreadableError || 'Unreadable workbook';
			await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', reason, tx);
			return { created: 0, skipped: rows.length, errors: [], upload_cuid: uploadRecord.cuid };
		}

		if (rows.length === 0) {
			await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', 'Empty workbook', tx);
			return { created: 0, skipped: 0, errors: [], upload_cuid: uploadRecord.cuid };
		}

		if (options) {
			if (options.missingEmpCode) {
				await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', "Required column 'Emp No' is missing.", tx);
				return { created: 0, skipped: rows.length, errors: [], upload_cuid: uploadRecord.cuid };
			}

			if (options.headerMonth === null || options.headerYear === null || options.headerMonth === undefined || options.headerYear === undefined) {
				await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', 'Payroll period could not be extracted from the report header.', tx);
				return { created: 0, skipped: rows.length, errors: [], upload_cuid: uploadRecord.cuid };
			}

			if (options.headerMonth !== month || options.headerYear !== year) {
				await uploadDao.updateEmployeeCount(uploadRecord.cuid, 0, 'failed', 'Selected payroll period does not match uploaded file period.', tx);
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
					await recordDao.create({
						payroll_upload_cuid: uploadRecord.cuid,
						row_number: row.rowIndex,
						employee_code: row.employee_code || null,
						employee_name: row.employee_name || null,
						status: 'failed',
						row_data: row,
						errors: { employee_code: errorMessage }
					}, tx);
					continue;
				}
				seenKeys.add(duplicateKey);
			}

			// 1. Row-level structure and type validation (via centralized validator)
			const validation = validatePayrollRow(row);
			const empCode = (row.employee_code || '').trim();

			// 1. Employee Code presence check
			const missingEmpCodeErr = validation.errors.find(e => e.error_type === 'Missing Employee Code');
			if (missingEmpCodeErr) {
				skipped++;
				errors.push({
					row: missingEmpCodeErr.row,
					employee_code: '(empty)',
					reason: missingEmpCodeErr.reason
				});
				await recordDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: missingEmpCodeErr.row,
					employee_code: null,
					employee_name: null,
					status: 'failed',
					row_data: row,
					errors: { employee_code: missingEmpCodeErr.reason }
				}, tx);
				continue;
			}

			// 2. Employee existence check (takes precedence over month/year/component validation errors)
			const employee = await findEmployeeByCode(empCode);
			if (!employee) {
				skipped++;
				const errorMessage = `Employee with code ${empCode} does not exist (not found)`;
				errors.push({
					row: row.rowIndex,
					employee_code: empCode,
					reason: errorMessage
				});
				await recordDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: row.rowIndex,
					employee_code: empCode,
					employee_name: row.employee_name || null,
					status: 'failed',
					row_data: row,
					errors: { employee_code: errorMessage }
				}, tx);
				continue;
			}

			// 3. Format/type validation checks (month, year, components)
			const formatErrors = validation.errors.filter(e => e.error_type === 'Validation Error');
			if (formatErrors.length > 0) {
				skipped++;
				const rowErrors: Record<string, string> = {};
				for (const err of formatErrors) {
					errors.push({
						row: err.row,
						employee_code: err.employee_code,
						reason: err.reason
					});
					
					if (err.reason.includes('Month')) {
						rowErrors['month'] = err.reason;
					} else if (err.reason.includes('Year')) {
						rowErrors['year'] = err.reason;
					} else if (err.reason.includes('must be numeric')) {
						const componentName = err.reason.split(' ')[0] || 'component';
						rowErrors[componentName] = err.reason;
					} else {
						rowErrors['validation'] = err.reason;
					}
				}
				await recordDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: row.rowIndex,
					employee_code: empCode,
					employee_name: row.employee_name || null,
					status: 'failed',
					row_data: row,
					errors: rowErrors
				}, tx);
				continue;
			}

			const validated = validation.validatedData!;

			// 4. Payroll does not already exist for Employee + Month + Year in DB.
			const existing = await dao.findByEmployeeMonthYear(
				employee.cuid,
				validated.month,
				validated.year,
				tx
			);
			if (existing) {
				skipped++;
				const errorMessage = `A payroll record for employee "${empCode}" for ${validated.year}-${String(validated.month).padStart(2, '0')} already exists.`;
				errors.push({
					row: row.rowIndex,
					employee_code: empCode,
					reason: errorMessage
				});
				await recordDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: row.rowIndex,
					employee_code: empCode,
					employee_name: validated.employee_name || employee.name,
					status: 'failed',
					row_data: row,
					errors: { employee_code: errorMessage }
				}, tx);
				continue;
			}

			// 5. Compute gross/deductions/net summary.
			const { gross_earnings, total_deduction, net_salary } = computeSummary(
				validated.components,
				validated.gross_earnings,
				validated.total_deduction,
				validated.net_salary
			);

			// 6. Create payroll record.
			try {
				await dao.create({
					employee_cuid: employee.cuid,
					month: validated.month,
					year: validated.year,
					gross_earnings,
					total_deduction,
					net_salary,
					breakdown: validated.components,
					payroll_upload_cuid: uploadRecord.cuid,
					created_by: created_by ?? null
				}, tx);

				await recordDao.create({
					payroll_upload_cuid: uploadRecord.cuid,
					row_number: row.rowIndex,
					employee_code: empCode,
					employee_name: validated.employee_name || employee.name,
					status: 'processed',
					row_data: row,
					errors: null
				}, tx);

				created++;
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				skipped++;
				if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
					const errorMessage = `A payroll record for employee "${empCode}" for ${validated.year}-${String(validated.month).padStart(2, '0')} already exists.`;
					errors.push({
						row: row.rowIndex,
						employee_code: empCode,
						reason: errorMessage
					});
					await recordDao.create({
						payroll_upload_cuid: uploadRecord.cuid,
						row_number: row.rowIndex,
						employee_code: empCode,
						employee_name: validated.employee_name || employee.name,
						status: 'failed',
						row_data: row,
						errors: { employee_code: errorMessage }
					}, tx);
				} else {
					errors.push({
						row: row.rowIndex,
						employee_code: empCode,
						reason: message
					});
					await recordDao.create({
						payroll_upload_cuid: uploadRecord.cuid,
						row_number: row.rowIndex,
						employee_code: empCode,
						employee_name: validated.employee_name || employee.name,
						status: 'failed',
						row_data: row,
						errors: { database: message }
					}, tx);
				}
			}
		}

	// Step 3: Update upload batch with final count and status
	const status = skipped > 0 && created === 0 ? 'failed' : skipped > 0 ? 'partial' : 'processed';
	await uploadDao.updateEmployeeCount(uploadRecord.cuid, created, status, null, tx);

	// Log completion and final summary of the bulk upload
	await auditService.log({
		entity_name: 'PayrollUpload',
		entity_cuid: uploadRecord.cuid,
		action_type: 'bulk_upload_complete',
		status: status === 'failed' ? 'FAILED' : status === 'partial' ? 'PARTIAL' : 'SUCCESS',
	}, tx);

	// Trigger payroll notification
	if (status === 'failed') {
		notificationFactory.payrollFailed(month, year, skipped, uploadRecord.cuid, created_by)
			.catch(err => console.error("Failed to send payroll failed notification:", err));
	} else {
		notificationFactory.payrollProcessed(month, year, created_by)
			.catch(err => console.error("Failed to send payroll processed notification:", err));
	}

		return { created, skipped, errors, upload_cuid: uploadRecord.cuid };
	});
}

async function enrichPayrolls(records: any[]): Promise<(any & { employee_code: string; employee_name: string })[]> {
	if (records.length === 0) return [];
	const cuids = Array.from(new Set(records.map(r => r.employee_cuid)));
	const employees = await db.employee.findMany({
		where: { cuid: { in: cuids } }
	});
	const empMap = new Map<string, { employee_code: string; employee_name: string }>();
	for (const emp of employees) {
		empMap.set(emp.cuid, {
			employee_code: emp.emp_code,
			employee_name: `${emp.first_name} ${emp.last_name}`
		});
	}

	return records.map(record => {
		const emp = empMap.get(record.employee_cuid);
		return {
			...record,
			employee_code: emp?.employee_code ?? '(unknown)',
			employee_name: emp?.employee_name ?? '(unknown)'
		};
	});
}

/**
 * Retrieve all payroll records.
 */
export async function getPayrolls() {
	const records = await dao.findMany();
	const enriched = await enrichPayrolls(records);
	enriched.sort((a, b) => {
		if (b.year !== a.year) {
			return b.year - a.year;
		}
		if (b.month !== a.month) {
			return b.month - a.month;
		}
		return a.employee_code.localeCompare(b.employee_code);
	});
	return serializePayrollList(enriched);
}

/**
 * Paid days & LOP days are not dedicated DB columns.
 * They may appear in the payroll breakdown JSON under recognisable key names,
 * or be dynamically calculated from attendance/leave records and month length.
 */
const PAID_DAYS_KEYS = new Set([
	'paid days', 'working days', 'days paid', 'days worked',
	'payable days', 'actual days', 'pay days'
]);

const LOP_DAYS_KEYS = new Set([
	'lop days', 'lop', 'loss of pay', 'loss of pay days',
	'unpaid days', 'lwp days', 'lwp', 'absent days'
]);

function extractPaidDays(breakdown: Record<string, number>): string | null {
	for (const [key, value] of Object.entries(breakdown)) {
		if (PAID_DAYS_KEYS.has(key.toLowerCase().trim())) {
			return String(value);
		}
	}
	return null;
}

function extractLopDays(breakdown: Record<string, number>): string | null {
	for (const [key, value] of Object.entries(breakdown)) {
		if (LOP_DAYS_KEYS.has(key.toLowerCase().trim())) {
			return String(value);
		}
	}
	return null;
}

/**
 * Fetch all Employee Master details required for payslip rendering.
 * Uses a controlled parallel query strategy to avoid N+1 problems.
 */
async function fetchEmployeeDetails(
	employeeCuid: string,
	breakdown: Record<string, number>,
	month?: number,
	year?: number
): Promise<PayrollEmployeeDetails> {
	// Extract or calculate LOP days
	let lopDaysStr = extractLopDays(breakdown);
	let lopDaysNum = lopDaysStr !== null ? Number(lopDaysStr) : null;

	if (lopDaysStr === null && month && year) {
		try {
			const usedLop = await getMonthlyUsedDays(employeeCuid, month, year, 'LOP');
			lopDaysNum = usedLop;
			lopDaysStr = String(usedLop);
		} catch (e) {
			console.error('Error calculating monthly LOP days:', e);
		}
	}

	// Extract or calculate Paid days
	let paidDaysStr = extractPaidDays(breakdown);
	if (paidDaysStr === null && month && year) {
		const totalDaysInMonth = new Date(year, month, 0).getDate();
		const lopCount = lopDaysNum ?? 0;
		const calculatedPaidDays = Math.max(0, totalDaysInMonth - lopCount);
		paidDaysStr = String(calculatedPaidDays);
	}

	// Step 1 find employee by CUID
	const employee = await employeeDao.findByCuid2(employeeCuid);

	if (!employee) {
		return {
			designation: null,
			location: null,
			date_of_joining: null,
			bank_name: null,
			bank_account_number: null,
			pan: null,
			pf_account_number: null,
			uan: null,
			paid_days: paidDaysStr,
			lop_days: lopDaysStr ?? '0'
		};
	}

	// Step 2 â€” parallel: employment record + bank details
	const [employment, bankDetails] = await Promise.all([
		employmentDao.findByEmployeeCuid(employee.cuid),
		bankDetailDao.findByEmployeeCuid(employee.cuid)
	]);

	// Pick primary bank (is_primary = true), fall back to first record
	const primaryBank =
		bankDetails.find((b) => b.is_primary) ?? bankDetails[0] ?? null;

	// Step 3 parallel: resolve CUIDs to names (only if present)
	const [designation, location] = await Promise.all([
		employment?.designation_cuid
			? designationDao.findByCuid2(employment.designation_cuid)
			: Promise.resolve(null),
		employment?.location_cuid
			? locationDao.getLocationByCuid(employment.location_cuid)
			: Promise.resolve(null)
	]);

	return {
		designation: designation?.name ?? null,
		location: location?.name ?? null,
		date_of_joining: employment?.date_of_joining
			? employment.date_of_joining.toISOString().split('T')[0]
			: null,
		bank_name: primaryBank?.bank_name ?? null,
		bank_account_number: primaryBank?.account_number ?? null,
		pan: employee.pan_no ?? null,
		pf_account_number: employee.pf_account_no ?? null,
		uan: employee.uan_no ?? null,
		paid_days: paidDaysStr,
		lop_days: lopDaysStr ?? '0'
	};
}

/**
 * Retrieve a single payroll record by its external cuid.
 * Enriches the result with Employee Master details for payslip rendering.
 * Throws PayrollNotFoundError if not found.
 */
export async function getPayrollByCuid(cuid: string) {
	const record = await dao.findByCuid(cuid);
	if (!record) {
		throw new PayrollNotFoundError(cuid);
	}
	const employee = await employeeDao.findByCuid2(record.employee_cuid);
	const employeeCode = employee?.emp_code ?? '(unknown)';
	const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '(unknown)';
	const breakdown = record.breakdown as Record<string, number>;
	const employeeDetails = await fetchEmployeeDetails(record.employee_cuid, breakdown, record.month, record.year);
	return serializePayroll(
		{
			...record,
			employee_code: employeeCode,
			employee_name: employeeName
		},
		employeeDetails
	);
}

/**
 * Retrieve all payroll records belonging to a specific upload batch.
 */
export async function getPayrollsByUploadCuid(uploadCuid: string) {
	const records = await dao.findManyByUploadCuid(uploadCuid);
	const enriched = await enrichPayrolls(records);
	enriched.sort((a, b) => a.employee_code.localeCompare(b.employee_code));
	return serializePayrollList(enriched);
}
