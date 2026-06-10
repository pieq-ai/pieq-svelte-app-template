import type { CreateSalaryComponentDto, UpdateSalaryComponentDto } from '$lib/types/salary-component.js';
import { validateComponentName } from '$lib/validators/salary-component.js';

export interface ValidationError {
	field: string;
	message: string;
}

// Keys that are allowed in the POST (create) body — no others may be present.
const CREATE_ALLOWED_KEYS = new Set<string>([
	'component_name',
	'component_type',
	'is_taxable',
	'status'
]);

// Keys that are allowed in the PUT (update) body — no others may be present.
const UPDATE_ALLOWED_KEYS = new Set<string>([
	'component_name',
	'component_type',
	'is_taxable',
	'status'
]);

/** Return the unknown keys present in `body` that are not in `allowed`. */
function findUnknownKeys(
	body: Record<string, unknown>,
	allowed: Set<string>
): string[] {
	return Object.keys(body).filter((k) => !allowed.has(k));
}

export function validateCreateSalaryComponent(data: unknown): {
	errors: ValidationError[];
	validatedData?: CreateSalaryComponentDto;
} {
	const errors: ValidationError[] = [];

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { errors: [{ field: 'body', message: 'Invalid request body' }] };
	}

	const body = data as Record<string, unknown>;

	// Reject unknown fields immediately
	const unknownKeys = findUnknownKeys(body, CREATE_ALLOWED_KEYS);
	if (unknownKeys.length > 0) {
		return {
			errors: [
				{
					field: 'body',
					message: `Unknown field(s) not allowed: ${unknownKeys.join(', ')}`
				}
			]
		};
	}

	// Validate component_name
	const nameError = validateComponentName(body.component_name);
	if (nameError) {
		errors.push({ field: 'component_name', message: nameError });
	}

	// Validate component_type
	const rawType = body.component_type;
	let component_type = '';
	if (rawType === undefined || rawType === null) {
		errors.push({ field: 'component_type', message: 'Component type is required' });
	} else if (typeof rawType !== 'string') {
		errors.push({ field: 'component_type', message: 'Component type must be a string' });
	} else {
		component_type = rawType.trim();
		if (component_type !== 'earning' && component_type !== 'deduction') {
			errors.push({
				field: 'component_type',
				message: 'Component type must be either "earning" or "deduction"'
			});
		}
	}

	// Validate is_taxable — must be boolean if present; defaults to false if absent
	let is_taxable = body.is_taxable;
	if (is_taxable === undefined) {
		is_taxable = false;
	} else if (typeof is_taxable !== 'boolean') {
		errors.push({ field: 'is_taxable', message: 'is_taxable must be a boolean' });
	}

	// Validate status — must be boolean if present; defaults to true if absent
	let status = body.status;
	if (status === undefined || status === null) {
		status = true;
	} else if (typeof status !== 'boolean') {
		errors.push({ field: 'status', message: 'status must be a boolean' });
	}

	if (errors.length > 0) {
		return { errors };
	}

	return {
		errors,
		validatedData: {
			component_name: (body.component_name as string).trim(),
			component_type: component_type as 'earning' | 'deduction',
			is_taxable: is_taxable as boolean,
			status: status as boolean
		}
	};
}

export function validateUpdateSalaryComponent(data: unknown): {
	errors: ValidationError[];
	validatedData?: UpdateSalaryComponentDto;
} {
	const errors: ValidationError[] = [];

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { errors: [{ field: 'body', message: 'Invalid request body' }] };
	}

	const body = data as Record<string, unknown>;

	// Reject unknown fields immediately
	const unknownKeys = findUnknownKeys(body, UPDATE_ALLOWED_KEYS);
	if (unknownKeys.length > 0) {
		return {
			errors: [
				{
					field: 'body',
					message: `Unknown field(s) not allowed: ${unknownKeys.join(', ')}`
				}
			]
		};
	}

	// Reject empty update body (at least one field must be supplied)
	if (Object.keys(body).length === 0) {
		return {
			errors: [{ field: 'body', message: 'Update body must contain at least one valid field' }]
		};
	}

	const validatedData: UpdateSalaryComponentDto = {};

	// Validate component_name if provided
	if (body.component_name !== undefined) {
		const nameError = validateComponentName(body.component_name);
		if (nameError) {
			errors.push({ field: 'component_name', message: nameError });
		} else if (body.component_name !== null) {
			validatedData.component_name = (body.component_name as string).trim();
		}
	}

	// Validate component_type if provided
	if (body.component_type !== undefined) {
		const rawType = body.component_type;
		if (rawType === null) {
			errors.push({ field: 'component_type', message: 'Component type cannot be null' });
		} else if (typeof rawType !== 'string') {
			errors.push({ field: 'component_type', message: 'Component type must be a string' });
		} else {
			const trimmed = rawType.trim();
			if (trimmed !== 'earning' && trimmed !== 'deduction') {
				errors.push({
					field: 'component_type',
					message: 'Component type must be either "earning" or "deduction"'
				});
			} else {
				validatedData.component_type = trimmed;
			}
		}
	}

	// Validate is_taxable if provided
	if (body.is_taxable !== undefined) {
		const is_taxable = body.is_taxable;
		if (typeof is_taxable !== 'boolean') {
			errors.push({ field: 'is_taxable', message: 'is_taxable must be a boolean' });
		} else {
			validatedData.is_taxable = is_taxable;
		}
	}

	// Validate status if provided
	if (body.status !== undefined) {
		const rawStatus = body.status;
		if (rawStatus === null) {
			errors.push({ field: 'status', message: 'status cannot be null' });
		} else if (typeof rawStatus !== 'boolean') {
			errors.push({ field: 'status', message: 'status must be a boolean' });
		} else {
			validatedData.status = rawStatus;
		}
	}

	if (errors.length > 0) {
		return { errors };
	}

	return {
		errors,
		validatedData
	};
}
