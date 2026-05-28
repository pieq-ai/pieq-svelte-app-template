import type { CreateSalaryComponentDto, UpdateSalaryComponentDto } from '$lib/types/salary-component.js';
import { validateComponentName } from '$lib/validators/salary-component.js';

export interface ValidationError {
	field: string;
	message: string;
}

export function validateCreateSalaryComponent(data: unknown): {
	errors: ValidationError[];
	validatedData?: CreateSalaryComponentDto;
} {
	const errors: ValidationError[] = [];

	if (!data || typeof data !== 'object') {
		return { errors: [{ field: 'body', message: 'Invalid request body' }] };
	}

	const body = data as Record<string, unknown>;

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
			errors.push({ field: 'component_type', message: 'Component type must be either "earning" or "deduction"' });
		}
	}

	// Validate is_taxable
	let is_taxable = body.is_taxable;
	if (is_taxable === undefined) {
		is_taxable = false;
	} else if (typeof is_taxable !== 'boolean') {
		errors.push({ field: 'is_taxable', message: 'is_taxable must be a boolean' });
	}

	// Validate is_active (optional, defaults to true)
	let is_active = body.is_active;
	if (is_active === undefined || is_active === null) {
		is_active = true;
	} else if (typeof is_active !== 'boolean') {
		errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
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
			is_active: is_active as boolean
		}
	};
}

export function validateUpdateSalaryComponent(data: unknown): {
	errors: ValidationError[];
	validatedData?: UpdateSalaryComponentDto;
} {
	const errors: ValidationError[] = [];

	if (!data || typeof data !== 'object') {
		return { errors: [{ field: 'body', message: 'Invalid request body' }] };
	}

	const body = data as Record<string, unknown>;
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
				errors.push({ field: 'component_type', message: 'Component type must be either "earning" or "deduction"' });
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

	// Validate is_active if provided
	if (body.is_active !== undefined) {
		const rawActive = body.is_active;
		if (rawActive === null) {
			errors.push({ field: 'is_active', message: 'is_active cannot be null' });
		} else if (typeof rawActive !== 'boolean') {
			errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
		} else {
			validatedData.is_active = rawActive;
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
