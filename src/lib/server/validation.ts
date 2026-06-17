/**
 * Trims leading/trailing whitespace from string fields recursively.
 * Preserves user-intended casing.
 */
export function trimStringFields<T>(val: T): T {
	if (typeof val === 'string') {
		return val.trim() as unknown as T;
	}
	if (Array.isArray(val)) {
		return val.map((item) => trimStringFields(item)) as unknown as T;
	}
	if (val !== null && typeof val === 'object') {
		const result = {} as Record<string, unknown>;
		const obj = val as Record<string, unknown>;
		for (const key of Object.keys(obj)) {
			result[key] = trimStringFields(obj[key]);
		}
		return result as unknown as T;
	}
	return val;
}

/**
 * Validates that all keys in the body are within the allowed keys.
 * Rejects incorrect or misspelled keys.
 */
export function validatePayloadKeys(body: unknown, allowedKeys: string[]): { error: string } | null {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return { error: 'Request body must be a valid JSON object' };
	}
	const allowedSet = new Set(allowedKeys);
	const keys = Object.keys(body as Record<string, unknown>);
	for (const key of keys) {
		if (!allowedSet.has(key)) {
			return { error: `Invalid, unexpected or misspelled key: "${key}"` };
		}
	}
	return null;
}
