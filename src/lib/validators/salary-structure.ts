/**
 * Client-safe validators for Salary Structure fields.
 * These run on both the server (in server validators) and the frontend (form validation).
 */

/** Validates the effective_from date string. Returns an error message or null. */
export function validateEffectiveFrom(value: unknown): string | null {
	if (value === undefined || value === null || value === '') {
		return 'Effective from date is required';
	}
	if (typeof value !== 'string') {
		return 'Effective from must be a date string';
	}
	const d = new Date(value);
	if (isNaN(d.getTime())) {
		return 'Effective from must be a valid date';
	}
	return null;
}

/**
 * Validates that effective_to is strictly after effective_from.
 * Only runs when both values are non-empty strings.
 * Returns an error message or null.
 */
export function validateEffectiveDateRange(
	effectiveFrom: string | null | undefined,
	effectiveTo: string | null | undefined
): string | null {
	if (!effectiveFrom || !effectiveTo) return null; // individual field validators handle empty cases
	const from = new Date(effectiveFrom);
	const to = new Date(effectiveTo);
	if (isNaN(from.getTime()) || isNaN(to.getTime())) return null; // individual field validators catch bad dates
	if (to <= from) {
		return 'Effective to must be after effective from';
	}
	return null;
}

/** Validates a component amount. Returns an error message or null. */
export function validateAmount(value: unknown): string | null {
	if (value === undefined || value === null) {
		return 'Amount is required';
	}
	if (typeof value !== 'number') {
		return 'Amount must be a number';
	}
	if (isNaN(value) || !isFinite(value)) {
		return 'Amount must be a valid number';
	}
	if (value < 0) {
		return 'Amount must be 0 or greater';
	}
	return null;
}
