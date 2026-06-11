export function validateEmploymentTypeName(name: unknown): string | null {
	if (name === undefined || name === null) {
		return 'Employment type is required';
	}
	if (typeof name !== 'string') {
		return 'Employment type must be a string';
	}

	const trimmed = name.trim();
	if (trimmed.length === 0) {
		return 'Employment type is required';
	}
	if (trimmed.length < 5) {
		return 'Employment type must be at least 5 characters long';
	}
	if (trimmed.length > 50) {
		return 'Employment type cannot exceed 50 characters';
	}

	// Reject reserved/system words
	const reserved = ['admin', 'null', 'undefined'];
	if (reserved.includes(trimmed.toLowerCase())) {
		return `"${trimmed}" is a reserved word and cannot be used`;
	}

	// Allowed characters: Alphabets, Spaces, Hyphen (-), Ampersand (&)
	if (!/^[A-Za-z\s&-]+$/.test(trimmed)) {
		return 'Only alphabets, spaces, hyphens (-), and ampersands (&) are allowed';
	}

	// No consecutive spaces
	if (/\s{2,}/.test(trimmed)) {
		return 'Consecutive spaces are not allowed';
	}

	// No leading/trailing special characters (hyphen or ampersand)
	if (/^[&-]/.test(trimmed)) {
		return 'Cannot start with a special character';
	}
	if (/[&-]$/.test(trimmed)) {
		return 'Cannot end with a special character';
	}

	return null;
}
