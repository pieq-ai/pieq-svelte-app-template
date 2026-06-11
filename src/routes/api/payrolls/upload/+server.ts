import { json } from '@sveltejs/kit';
import { parsePayrollExcel } from '$lib/server/utils/excel-parser.js';
import { uploadPayroll } from '$lib/server/services/payroll.service.js';
import { validateExcelExtension } from '$lib/server/validators/payroll.validator.js';

/**
 * POST /api/payrolls/upload
 *
 * Accepts a multipart/form-data request with a single `file` field
 * containing the payroll Excel (.xlsx or .xls).
 *
 * Returns:
 *   { data: { created: number, skipped: number, errors: [...] } }
 */
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return json({ message: 'No file provided. Send a multipart/form-data request with a "file" field.' }, { status: 400 });
		}

		// Validate file extension
		if (!validateExcelExtension(file.name)) {
			return json(
				{ message: `Invalid file type. Only .xlsx and .xls files are accepted. Received: "${file.name}".` },
				{ status: 400 }
			);
		}

		// Read default month and year parameters
		const defaultMonthRaw = formData.get('month');
		const defaultYearRaw = formData.get('year');

		const defaultMonth = defaultMonthRaw ? parseInt(String(defaultMonthRaw), 10) : null;
		const defaultYear = defaultYearRaw ? parseInt(String(defaultYearRaw), 10) : null;

		// Read file buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Parse Excel
		const { rows, warnings } = parsePayrollExcel(buffer, defaultMonth, defaultYear);

		if (rows.length === 0) {
			return json(
				{
					message: 'No data rows found in the uploaded file.',
					warnings
				},
				{ status: 400 }
			);
		}

		// Process rows through service
		const result = await uploadPayroll(rows);

		return json({
			data: {
				created: result.created,
				skipped: result.skipped,
				errors: result.errors,
				warnings
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
