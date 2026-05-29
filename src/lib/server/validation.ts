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
		const result: any = {};
		for (const key of Object.keys(val)) {
			result[key] = trimStringFields((val as any)[key]);
		}
		return result as T;
	}
	return val;
}

/**
 * Validates that all keys in the body are within the allowed keys.
 * Rejects incorrect or misspelled keys.
 */
export function validatePayloadKeys(body: any, allowedKeys: string[]): { error: string } | null {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return { error: 'Request body must be a valid JSON object' };
	}
	const allowedSet = new Set(allowedKeys);
	const keys = Object.keys(body);
	for (const key of keys) {
		if (!allowedSet.has(key)) {
			return { error: `Invalid, unexpected or misspelled key: "${key}"` };
		}
	}
	return null;
}
