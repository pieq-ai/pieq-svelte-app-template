import type { CreateSalaryComponentDto, UpdateSalaryComponentDto } from '$lib/types/salary-component.js';

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
	const rawName = body.component_name;
	let trimmedName = '';
	if (rawName === undefined || rawName === null) {
		errors.push({ field: 'component_name', message: 'Component name is required' });
	} else if (typeof rawName !== 'string') {
		errors.push({ field: 'component_name', message: 'Component name must be a string' });
	} else {
		trimmedName = rawName.trim();
		if (trimmedName.length < 2) {
			errors.push({ field: 'component_name', message: 'Component name must be at least 2 characters long' });
		} else if (trimmedName.length > 150) {
			errors.push({ field: 'component_name', message: 'Component name cannot exceed 150 characters' });
		}
	}

	// Validate component_type
	const component_type = body.component_type;
	if (!component_type) {
		errors.push({ field: 'component_type', message: 'Component type is required' });
	} else if (component_type !== 'earning' && component_type !== 'deduction') {
		errors.push({ field: 'component_type', message: 'Component type must be either "earning" or "deduction"' });
	}

	// Validate is_taxable
	let is_taxable = body.is_taxable;
	if (is_taxable === undefined) {
		is_taxable = false;
	} else if (typeof is_taxable !== 'boolean') {
		errors.push({ field: 'is_taxable', message: 'is_taxable must be a boolean' });
	}

	// Validate status
	let status = body.status;
	if (status === undefined) {
		status = 'active';
	} else if (status !== 'active' && status !== 'inactive') {
		errors.push({ field: 'status', message: 'Status must be either "active" or "inactive"' });
	}

	if (errors.length > 0) {
		return { errors };
	}

	return {
		errors,
		validatedData: {
			component_name: trimmedName,
			component_type: component_type as 'earning' | 'deduction',
			is_taxable: is_taxable as boolean,
			status: status as 'active' | 'inactive'
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
		const rawName = body.component_name;
		if (rawName === null) {
			errors.push({ field: 'component_name', message: 'Component name cannot be null' });
		} else if (typeof rawName !== 'string') {
			errors.push({ field: 'component_name', message: 'Component name must be a string' });
		} else {
			const trimmed = rawName.trim();
			if (trimmed.length < 2) {
				errors.push({ field: 'component_name', message: 'Component name must be at least 2 characters long' });
			} else if (trimmed.length > 150) {
				errors.push({ field: 'component_name', message: 'Component name cannot exceed 150 characters' });
			} else {
				validatedData.component_name = trimmed;
			}
		}
	}

	// Validate component_type if provided
	if (body.component_type !== undefined) {
		const component_type = body.component_type;
		if (component_type !== 'earning' && component_type !== 'deduction') {
			errors.push({ field: 'component_type', message: 'Component type must be either "earning" or "deduction"' });
		} else {
			validatedData.component_type = component_type;
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
		const status = body.status;
		if (status !== 'active' && status !== 'inactive') {
			errors.push({ field: 'status', message: 'Status must be either "active" or "inactive"' });
		} else {
			validatedData.status = status;
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
