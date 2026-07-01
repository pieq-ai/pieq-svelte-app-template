import { requirePermission } from '$lib/server/authz/guards';
import { json } from '@sveltejs/kit';
import { parsePayrollExcel } from '$lib/server/utils/excel-parser.js';
import type { ParsedPayrollRow, ParseResult } from '$lib/server/utils/excel-parser.js';
import { uploadPayroll } from '$lib/server/services/payroll.service.js';
import { validateExcelExtension, validateExcelMimeType } from '$lib/server/validators/payroll.validator.js';

/**
 * POST /api/payrolls/upload
 *
 * Accepts a multipart/form-data request with a single `file` field
 * containing the payroll Excel (.xlsx or .xls), plus `month` and `year`
 * form fields for the pay period.
 *
 * Returns:
 *   { data: { created, skipped, errors, upload_cuid, warnings } }
 */
export async function POST({ request }) {
	try {
		
		requirePermission(locals.user, 'payroll:view');
const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return json({ message: 'No file provided. Send a multipart/form-data request with a "file" field.' }, { status: 400 });
		}

		// Validate file size (max 2 MB)
		if (file.size > 2 * 1024 * 1024) {
			return json(
				{ message: 'File size exceeds the 2 MB limit.' },
				{ status: 400 }
			);
		}

		// Validate file extension
		if (!validateExcelExtension(file.name)) {
			return json(
				{ message: `Invalid file type. Only .xlsx and .xls files are accepted. Received: "${file.name}".` },
				{ status: 400 }
			);
		}

		// Validate file MIME type
		if (!validateExcelMimeType(file.type)) {
			return json(
				{ message: `Invalid file type. Only Excel files (.xlsx, .xls) are accepted. Received: "${file.type}".` },
				{ status: 400 }
			);
		}

		// Read and validate month/year parameters (required for the upload batch record)
		const defaultMonthRaw = formData.get('month');
		const defaultYearRaw = formData.get('year');

		const defaultMonth = defaultMonthRaw ? parseInt(String(defaultMonthRaw), 10) : null;
		const defaultYear = defaultYearRaw ? parseInt(String(defaultYearRaw), 10) : null;

		if (!defaultMonth || defaultMonth < 1 || defaultMonth > 12) {
			return json({ message: 'A valid pay month (1-12) is required.' }, { status: 400 });
		}
		if (!defaultYear || defaultYear < 2000 || defaultYear > 9999) {
			return json({ message: 'A valid 4-digit pay year is required.' }, { status: 400 });
		}

		let rows: ParsedPayrollRow[] = [];
		let parseResult: ParseResult | null = null;
		let unreadable = false;
		let unreadableError = '';

		try {
			// Read file buffer
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Parse Excel
			parseResult = parsePayrollExcel(buffer);
			rows = parseResult.rows;
		} catch (error) {
			unreadable = true;
			unreadableError = (error as Error).message || 'Failed to parse Excel file';
		}

		// Process rows through service — creates upload batch + individual payroll records
		const result = await uploadPayroll(
			rows,
			defaultMonth,
			defaultYear,
			file.name,
			null, // created_by
			{
				unreadable,
				unreadableError,
				detectedHeaders: parseResult?.detectedHeaders,
				columnMapping: parseResult?.columnMapping,
				headerMonth: parseResult?.headerMonth,
				headerYear: parseResult?.headerYear,
				headerPeriodStr: parseResult?.headerPeriodStr,
				missingEmpCode: parseResult?.missingEmpCode
			}
		);

		let message = 'Upload processed.';
		if (result.created === 0 && result.skipped > 0) {
			const isAllDuplicate = result.errors.length > 0 && result.errors.every(
				(err) => err.reason && (
					err.reason.toLowerCase().includes('already exists') ||
					err.reason.toLowerCase().includes('duplicate')
				)
			);
			message = isAllDuplicate
				? 'Upload failed due to duplicate upload entries.'
				: `Upload failed: No records were created. ${result.skipped} row(s) skipped/failed.`;
		} else if (result.created > 0 && result.skipped > 0) {
			message = `${result.created} payroll record(s) uploaded successfully. ${result.skipped} row(s) skipped/failed.`;
		} else {
			message = `${result.created} payroll record(s) uploaded successfully.`;
		}

		return json({
			message,
			data: {
				created: result.created,
				skipped: result.skipped,
				errors: result.errors,
				upload_cuid: result.upload_cuid,
				warnings: parseResult?.warnings || []
			}
		});
	} catch (error) {
		console.error('Error in POST /api/payrolls/upload:', error);
		return json(
			{ message: (error as Error).message || 'Failed to process payroll upload.' },
			{ status: 500 }
		);
	}
}
