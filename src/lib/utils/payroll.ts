/**
 * Shared payroll helper utilities for payslip classification and rendering.
 */

const DEDUCTION_KEYWORDS = [
	'pf', 'provident', 'professional tax', 'prof tax', 'pt',
	'income tax', 'tds', 'esi', 'esic',
	'meal pass', 'meal deduction',
	'deduction', 'recovery', 'advance', 'loan',
	'lwp', 'leave without pay', 'absent', 'absence',
	'penalty', 'fine', 'nps'
];

export function isDeductionComponent(name: string): boolean {
	const lower = name.toLowerCase().trim();

	// "Others" or "Other" as standalone components are always deductions
	if (lower === 'other' || lower === 'others') {
		return true;
	}

	return DEDUCTION_KEYWORDS.some(kw => lower.includes(kw));
}

export function isMeaningful(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	const n = Number(value);
	if (isNaN(n) || n === 0) return false;
	const str = String(value).trim();
	if (str === '' || str === '-' || str === '0' || str === '0.00') return false;
	return true;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
	'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
	'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
	if (n < 20) return ONES[n];
	return (TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')).trim();
}

export function numberToWords(n: number): string {
	const amount = Math.round(Math.abs(n));
	if (amount === 0) return 'Zero';

	let result = '';
	const crore = Math.floor(amount / 10_000_000);
	const lakh  = Math.floor((amount % 10_000_000) / 100_000);
	const thou  = Math.floor((amount % 100_000) / 1_000);
	const hund  = Math.floor((amount % 1_000) / 100);
	const rest  = amount % 100;

	if (crore) result += twoDigitWords(crore) + ' Crore ';
	if (lakh)  result += twoDigitWords(lakh)  + ' Lakh ';
	if (thou)  result += twoDigitWords(thou)   + ' Thousand ';
	if (hund)  result += ONES[hund]             + ' Hundred ';
	if (rest)  result += twoDigitWords(rest)    + ' ';

	return result.trim() + ' Only';
}

export function getEarningsAndDeductions(breakdown: Record<string, number>): {
	earnings: [string, number][];
	deductions: [string, number][];
} {
	const entries = Object.entries(breakdown || {}) as [string, number][];
	const earnings = entries
		.filter(([k, v]) => isMeaningful(v) && !isDeductionComponent(k) && Number(v) > 0)
		.sort(([, a], [, b]) => b - a);

	const deductions = entries
		.filter(([k, v]) => isMeaningful(v) && (isDeductionComponent(k) || Number(v) < 0))
		.sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

	return { earnings, deductions };
}
