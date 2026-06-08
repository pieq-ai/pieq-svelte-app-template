/**
 * Validates a department name against enterprise constraints.
 * Checks for:
 * 1. Presence (not null/undefined/empty string)
 * 2. Length (2 to 100 characters)
 * 3. Character restrictions (only alphabets and spaces allowed, regex: /^[A-Za-z\s]+$/)
 * 
 * Returns the trimmed and validated string, or throws an Error.
 */
export function validateDepartmentName(name: string | null | undefined): string {
	if (name === undefined || name === null) {
		throw new Error('Department name is required');
	}

	const trimmed = name.trim();
	if (trimmed === '') {
		throw new Error('Department name is required');
	}

	if (trimmed.length < 2) {
		throw new Error('Department name must be at least 2 characters long');
	}

	if (trimmed.length > 100) {
		throw new Error('Department name cannot exceed 100 characters');
	}

	const regex = /^[A-Za-z\s]+$/;
	if (!regex.test(trimmed)) {
		throw new Error('Department name must contain only letters and spaces');
	}

	// Convert to Title Case for consistent storage
	const titleCased = trimmed
		.toLowerCase()
		.split(/\s+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	return titleCased;
}
