/**
 * Excel Parser for Payroll Upload.
 *
 * Expected Excel columns (case-insensitive, trimmed):
 *   - "Emp No" / "Emp. No" / "Employee No" / "Employee Code" etc. → employee_code (required)
 *   - "Emp Name" / "Employee Name" / "Name" etc.                  → employee_name (optional)
 *   - "Month" / "Pay Month"                                        → month (text or numeric)
 *   - "Year"  / "Pay Year"                                         → year (4-digit)
 *
 * All other numeric columns are stored in payroll_breakdown.
 */

import * as XLSX from 'xlsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedPayrollRow {
	/** Row number in the sheet (1-indexed, header is row 1) */
	rowIndex: number;
	employee_code: string;
	employee_name: string;
	month: number | null;
	year: number | null;
	components: Record<string, number>;
	rawComponents?: Record<string, unknown>;
	gross_earnings?: number;
	total_deduction?: number;
	net_salary?: number;
	isEmpty: boolean;
}

export interface ParseResult {
	rows: ParsedPayrollRow[];
	/** Headers that were detected in the sheet (for debugging) */
	detectedHeaders: string[];
	/** Column mapping that was resolved (for debugging) */
	columnMapping: Record<string, string>;
	warnings: string[];
	headerMonth: number | null;
	headerYear: number | null;
	headerPeriodStr: string;
	missingEmpCode: boolean;
}

// ─── Month normalisation ────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
	january: 1, jan: 1,
	february: 2, feb: 2,
	march: 3, mar: 3,
	april: 4, apr: 4,
	may: 5,
	june: 6, jun: 6,
	july: 7, jul: 7,
	august: 8, aug: 8,
	september: 9, sep: 9, sept: 9,
	october: 10, oct: 10,
	november: 11, nov: 11,
	december: 12, dec: 12
};

export function parseMonth(raw: unknown): number | null {
	if (raw === null || raw === undefined || raw === '') return null;

	if (typeof raw === 'number') {
		const n = Math.round(raw);
		return n >= 1 && n <= 12 ? n : null;
	}

	const str = String(raw).trim().toLowerCase();
	if (MONTH_NAMES[str] !== undefined) return MONTH_NAMES[str];

	const n = parseInt(str, 10);
	if (!isNaN(n) && n >= 1 && n <= 12) return n;

	return null;
}

export function parseYear(raw: unknown): number | null {
	if (raw === null || raw === undefined || raw === '') return null;

	const n = typeof raw === 'number' ? Math.round(raw) : parseInt(String(raw).trim(), 10);
	if (isNaN(n)) return null;
	return n >= 2000 && n <= 9999 ? n : null;
}

// ─── Column classification ─────────────────────────────────────────────────────

/** Normalise header: lowercase + trim + collapse whitespace + strip punctuation like dots/# */
function normalise(s: string): string {
	return s
		.trim()
		.toLowerCase()
		.replace(/[.#*]/g, '')   // remove common punctuation in headers
		.replace(/\s+/g, ' ');   // collapse multiple spaces
}

// Employee code column — broad matching
const IDENTITY_KEYS = new Set([
	'emp no', 'emp no', 'empno', 'emp number', 'employee no',
	'employee number', 'employee code', 'emp code', 'empcode',
	'employee id', 'emp id', 'empid', 'staff no', 'staff id',
	'staff code', 'payroll no', 'payroll id', 'worker no',
	'worker id', 'id', 'code'
]);

// Employee name column
const NAME_KEYS = new Set([
	'emp name', 'empname', 'employee name', 'name', 'full name',
	'fullname', 'staff name', 'worker name'
]);

// Month column
const MONTH_KEYS = new Set([
	'month', 'pay month', 'payroll month', 'salary month',
	'month name', 'period month'
]);

// Year column
const YEAR_KEYS = new Set([
	'year', 'pay year', 'payroll year', 'salary year',
	'yr', 'period year'
]);

// Summary columns — stored separately, excluded from breakdown
const GROSS_KEYS = new Set([
	'gross earnings', 'gross salary', 'total earnings', 'gross pay',
	'gross', 'total gross', 'ctc', 'total salary'
]);

const DEDUCTION_KEYS = new Set([
	'total deduction', 'total deductions', 'deduction total',
	'deductions', 'total deduct', 'net deductions'
]);

const NET_KEYS = new Set([
	'net salary', 'net pay', 'take home', 'take home salary',
	'net', 'net amount', 'actual salary', 'payable salary',
	'salary payable'
]);

/** All non-component columns to skip from breakdown */
const RESERVED_KEYS = new Set([
	...GROSS_KEYS, ...DEDUCTION_KEYS, ...NET_KEYS,
	'doj', 'date of joining', 'date of birth', 'dob',
	'title', 'designation', 'department', 'dept',
	'location', 'branch', 'bank', 'bank name', 'bank account',
	'account no', 'account number', 'ifsc', 'ifsc code',
	'pan', 'pan no', 'uan', 'uan no', 'pf no', 'esic no',
	'sl no', 'sr no', 'sno', 's no', 'serial no', 'serial',
	'sn', 'sr', 'category', 'grade', 'level', 'band',
	'joining date', 'exit date', 'status', 'remarks'
]);

// ─── Safe number parsing ────────────────────────────────────────────────────────

function safeNumber(raw: unknown): number {
	if (raw === null || raw === undefined || raw === '') return 0;
	if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
	const n = parseFloat(String(raw).replace(/,/g, '').trim());
	return isNaN(n) ? 0 : n;
}

// ─── Main parser ────────────────────────────────────────────────────────────────

export function parsePayrollExcel(
	buffer: Buffer
): ParseResult {
	const warnings: string[] = [];

	const workbook = XLSX.read(buffer, { type: 'buffer', raw: false, cellDates: false });

	const sheetName = workbook.SheetNames[0];
	if (!sheetName) {
		return {
			rows: [],
			detectedHeaders: [],
			columnMapping: {},
			warnings: ['Workbook is empty — no sheets found.'],
			headerMonth: null,
			headerYear: null,
			headerPeriodStr: '',
			missingEmpCode: true
		};
	}

	const sheet = workbook.Sheets[sheetName];

	const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
		header: 1,
		defval: null,
		blankrows: true
	}) as unknown[][];

	if (raw.length === 0) {
		return {
			rows: [],
			detectedHeaders: [],
			columnMapping: {},
			warnings: ['Sheet is empty.'],
			headerMonth: null,
			headerYear: null,
			headerPeriodStr: '',
			missingEmpCode: true
		};
	}

	// ── Scan for Report Header / Period ──────────────────────────────────────
	let headerMonth: number | null = null;
	let headerYear: number | null = null;
	let headerPeriodStr = '';

	const titleRegex = /Salary Details for the month\s+([A-Za-z]+)\s*'?\s*(\d{2,4})/i;

	for (let i = 0; i < Math.min(raw.length, 15); i++) {
		const row = raw[i] ?? [];
		for (const cell of row) {
			if (cell != null) {
				const str = String(cell).trim();
				const match = str.match(titleRegex);
				if (match) {
					const monthStr = match[1];
					const yearStr = match[2];
					headerMonth = parseMonth(monthStr);

					let yr = parseInt(yearStr, 10);
					if (!isNaN(yr)) {
						if (yearStr.length === 2) {
							yr = 2000 + yr;
						}
						headerYear = parseYear(yr);
					}
					headerPeriodStr = str;
					break;
				}
			}
		}
		if (headerMonth !== null && headerYear !== null) {
			break;
		}
	}

	// ── Find header row ──────────────────────────────────────────────────────
	// Scan first 15 rows for a row that contains an employee identity key.
	let headerRowIdx = -1;
	let headers: string[] = [];

	for (let i = 0; i < Math.min(raw.length, 15); i++) {
		const candidate = (raw[i] ?? []).map((c) => (c != null ? String(c) : ''));
		const normCandidates = candidate.map(normalise);
		if (normCandidates.some((h) => IDENTITY_KEYS.has(h))) {
			headerRowIdx = i;
			headers = candidate;
			break;
		}
	}

	if (headerRowIdx === -1) {
		// Fallback: use first non-empty row as header
		for (let i = 0; i < Math.min(raw.length, 5); i++) {
			const candidate = (raw[i] ?? []).map((c) => (c != null ? String(c) : ''));
			if (candidate.some((c) => c.trim())) {
				headerRowIdx = i;
				headers = candidate;
				break;
			}
		}
		const foundCols = headers.filter((h) => h.trim()).slice(0, 8).join(', ');
		warnings.push(
			`Could not find a recognised header row. ` +
			`Falling back to row ${headerRowIdx + 1} as header. ` +
			`Columns found: [${foundCols}]. ` +
			`Expected columns like "Emp No".`
		);
	}

	const normHeaders = headers.map(normalise);

	// ── Resolve column indices ───────────────────────────────────────────────
	const empCodeIdx = normHeaders.findIndex((h) => IDENTITY_KEYS.has(h));
	const empNameIdx = normHeaders.findIndex((h) => NAME_KEYS.has(h));
	const monthIdx   = normHeaders.findIndex((h) => MONTH_KEYS.has(h));
	const yearIdx    = normHeaders.findIndex((h) => YEAR_KEYS.has(h));

	// Build column mapping for debug response
	const columnMapping: Record<string, string> = {};
	if (empCodeIdx >= 0) columnMapping['employee_code'] = headers[empCodeIdx];
	if (empNameIdx >= 0) columnMapping['employee_name'] = headers[empNameIdx];
	if (monthIdx   >= 0) columnMapping['month']         = headers[monthIdx];
	if (yearIdx    >= 0) columnMapping['year']           = headers[yearIdx];

	const missingEmpCode = empCodeIdx === -1;

	// ── Parse data rows ──────────────────────────────────────────────────────
	const rows: ParsedPayrollRow[] = [];

	for (let r = headerRowIdx + 1; r < raw.length; r++) {
		const dataRow = raw[r] ?? [];

		const isEmpty = dataRow.every((cell) => cell === null || cell === undefined || cell === '');
		if (isEmpty) continue;

		const employeeCode = empCodeIdx >= 0 ? String(dataRow[empCodeIdx] ?? '').trim() : '';
		const employeeName = empNameIdx >= 0 ? String(dataRow[empNameIdx] ?? '').trim() : '';

		// The payroll period from report header applies to every row in the file
		const month = headerMonth;
		const year = headerYear;

		const components: Record<string, number> = {};
		const rawComponents: Record<string, unknown> = {};
		let gross_earnings: number | undefined;
		let total_deduction: number | undefined;
		let net_salary: number | undefined;

		for (let c = 0; c < headers.length; c++) {
			const header     = headers[c];
			const normHeader = normHeaders[c];

			if (
				c === empCodeIdx ||
				c === empNameIdx ||
				c === monthIdx   ||
				c === yearIdx    ||
				!header.trim()
			) continue;

			const cellValue = dataRow[c];
			const num = safeNumber(cellValue);

			if (GROSS_KEYS.has(normHeader))     { gross_earnings   = num; continue; }
			if (DEDUCTION_KEYS.has(normHeader)) { total_deduction   = num; continue; }
			if (NET_KEYS.has(normHeader))       { net_salary        = num; continue; }
			if (RESERVED_KEYS.has(normHeader))  { continue; }

			if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
				components[header.trim()] = num;
				rawComponents[header.trim()] = cellValue;
			}
		}

		rows.push({
			rowIndex: r + 1,
			employee_code: employeeCode,
			employee_name: employeeName,
			month,
			year,
			components,
			rawComponents,
			gross_earnings,
			total_deduction,
			net_salary,
			isEmpty: false
		});
	}

	return {
		rows,
		detectedHeaders: headers.filter((h) => h.trim()),
		columnMapping,
		warnings,
		headerMonth,
		headerYear,
		headerPeriodStr,
		missingEmpCode
	};
}
