export function validateComponentName(name: unknown): string | null {
	if (name === undefined || name === null) {
		return 'Component name is required';
	}
	if (typeof name !== 'string') {
		return 'Component name must be a string';
	}

	const trimmed = name.trim();
	if (trimmed.length === 0) {
		return 'Component name is required';
	}
	if (trimmed.length < 2) {
		return 'Component name is short';
	}
	if (trimmed.length > 150) {
		return 'Component name is long';
	}
	// Prevent multiple consecutive spaces
	if (/\s{2,}/.test(trimmed)) {
		return 'Multiple consecutive spaces are not allowed';
	}
	// Allow only letters, numbers, spaces, hyphens (-), ampersands (&), and parentheses (())
	if (!/^[a-zA-Z0-9\s()&-]+$/.test(trimmed)) {
		return 'Special characters are not allowed';
	}

	return null;
}
