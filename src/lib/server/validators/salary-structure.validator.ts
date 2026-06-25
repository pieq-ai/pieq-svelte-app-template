import {
	validateEffectiveFrom,
	validateEffectiveDateRange,
	validateAmount
} from '$lib/validators/salary-structure.js';
import type {
	CreateSalaryStructureDto,
	UpdateSalaryStructureDto,
	CreateRevisionDto
} from '$lib/types/salary-structure.js';

export interface ValidationError {
	field: string;
	message: string;
}

// ─── Allowed key sets ─────────────────────────────────────────────────────────

/** Keys allowed in POST (create) body — unknown keys are rejected immediately. */
const CREATE_ALLOWED_KEYS = new Set<string>([
	'employee_cuid',
	'effective_from',
	'effective_to',
	'components',
	'confirmAdjustment'
]);

/** Keys allowed in PUT (update) body — unknown keys are rejected immediately. */
const UPDATE_ALLOWED_KEYS = new Set<string>([
	'employee_cuid',
	'effective_from',
	'effective_to',
	'status',
	'components',
	'confirmAdjustment'
]);

/** Keys allowed in POST revision body. */
const REVISION_ALLOWED_KEYS = new Set<string>(['effective_from', 'components']);

/** Keys allowed on each component object. */
const COMPONENT_ALLOWED_KEYS = new Set<string>(['salary_component_cuid', 'amount']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findUnknownKeys(body: Record<string, unknown>, allowed: Set<string>): string[] {
	return Object.keys(body).filter((k) => !allowed.has(k));
}

function validateComponents(
	components: unknown,
	errors: ValidationError[],
	fieldPrefix = 'components'
): boolean {
	if (!Array.isArray(components)) {
		errors.push({ field: fieldPrefix, message: 'Components must be an array' });
		return false;
	}
	if (components.length === 0) {
		errors.push({ field: fieldPrefix, message: 'At least one salary component is required' });
		return false;
	}

	const seenComponentCuids = new Set<string>();
	let valid = true;

	for (let i = 0; i < components.length; i++) {
		const item = components[i];
		if (!item || typeof item !== 'object' || Array.isArray(item)) {
			errors.push({ field: `${fieldPrefix}[${i}]`, message: 'Each component must be an object' });
			valid = false;
			continue;
		}

		const obj = item as Record<string, unknown>;

		// Reject unknown component keys
		const unknownItemKeys = Object.keys(obj).filter((k) => !COMPONENT_ALLOWED_KEYS.has(k));
		if (unknownItemKeys.length > 0) {
			errors.push({
				field: `${fieldPrefix}[${i}]`,
				message: `Unknown field(s) not allowed: ${unknownItemKeys.join(', ')}`
			});
			valid = false;
			continue;
		}

		// Validate salary_component_cuid
		if (obj.salary_component_cuid === undefined || obj.salary_component_cuid === null) {
			errors.push({
				field: `${fieldPrefix}[${i}].salary_component_cuid`,
				message: 'salary_component_cuid is required'
			});
			valid = false;
		} else if (typeof obj.salary_component_cuid !== 'string' || !obj.salary_component_cuid.trim()) {
			errors.push({
				field: `${fieldPrefix}[${i}].salary_component_cuid`,
				message: 'salary_component_cuid must be a non-empty string'
			});
			valid = false;
		} else {
			const compCuid = obj.salary_component_cuid.trim();
			if (seenComponentCuids.has(compCuid)) {
				errors.push({
					field: `${fieldPrefix}[${i}].salary_component_cuid`,
					message: `Duplicate salary component: ${compCuid}`
				});
				valid = false;
			} else {
				seenComponentCuids.add(compCuid);
			}
		}

		// Validate amount
		const amountError = validateAmount(obj.amount);
		if (amountError) {
			errors.push({ field: `${fieldPrefix}[${i}].amount`, message: amountError });
			valid = false;
		}
	}

	return valid;
}

// ─── Create validator ─────────────────────────────────────────────────────────

export function validateCreateSalaryStructure(data: unknown): {
	errors: ValidationError[];
	validatedData?: CreateSalaryStructureDto;
} {
	const errors: ValidationError[] = [];

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { errors: [{ field: 'body', message: 'Invalid request body' }] };
	}

	const body = data as Record<string, unknown>;

	// Reject unknown top-level fields immediately
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

	// Validate employee_cuid
	if (!body.employee_cuid || typeof body.employee_cuid !== 'string' || !body.employee_cuid.trim()) {
		errors.push({ field: 'employee_cuid', message: 'employee_cuid is required' });
	}

	// Validate effective_from
	const effectiveFromError = validateEffectiveFrom(body.effective_from);
	if (effectiveFromError) {
		errors.push({ field: 'effective_from', message: effectiveFromError });
	}

	// Validate effective_to (optional, but must be valid date if present)
	if (body.effective_to !== undefined && body.effective_to !== null && body.effective_to !== '') {
		if (typeof body.effective_to !== 'string') {
			errors.push({ field: 'effective_to', message: 'effective_to must be a date string' });
		} else {
			const d = new Date(body.effective_to);
			if (isNaN(d.getTime())) {
				errors.push({ field: 'effective_to', message: 'effective_to must be a valid date' });
			} else if (!effectiveFromError && typeof body.effective_from === 'string') {
				// Cross-field: effective_to must be after effective_from
				const rangeError = validateEffectiveDateRange(body.effective_from, body.effective_to);
				if (rangeError) {
					errors.push({ field: 'effective_to', message: rangeError });
				}
			}
		}
	}

	// Validate components
	const componentsValid = validateComponents(body.components, errors);

	if (errors.length > 0) {
		return { errors };
	}

	if (!componentsValid) {
		return { errors };
	}

	const rawComponents = body.components as Array<Record<string, unknown>>;

	return {
		errors: [],
		validatedData: {
			employee_cuid: (body.employee_cuid as string).trim(),
			effective_from: body.effective_from as string,
			effective_to:
				body.effective_to && body.effective_to !== ''
					? (body.effective_to as string)
					: null,
			status: true,
			components: rawComponents.map((item) => ({
				salary_component_cuid: (item.salary_component_cuid as string).trim(),
				amount: item.amount as number
			})),
			confirmAdjustment: body.confirmAdjustment as boolean | undefined
		}
	};
}

// ─── Update validator ─────────────────────────────────────────────────────────

export function validateUpdateSalaryStructure(data: unknown): {
	errors: ValidationError[];
	validatedData?: UpdateSalaryStructureDto;
} {
	const errors: ValidationError[] = [];

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { errors: [{ field: 'body', message: 'Invalid request body' }] };
	}

	const body = data as Record<string, unknown>;

	// Reject unknown top-level fields immediately
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

	// Reject empty body
	if (Object.keys(body).length === 0) {
		return {
			errors: [{ field: 'body', message: 'Update body must contain at least one valid field' }]
		};
	}

	const validatedData: UpdateSalaryStructureDto = {};

	// Validate employee_cuid if provided
	if (body.employee_cuid !== undefined) {
		if (
			!body.employee_cuid ||
			typeof body.employee_cuid !== 'string' ||
			!body.employee_cuid.trim()
		) {
			errors.push({ field: 'employee_cuid', message: 'employee_cuid must be a non-empty string' });
		} else {
			validatedData.employee_cuid = (body.employee_cuid as string).trim();
		}
	}

	// Validate effective_from if provided
	let effectiveFromStr: string | undefined;
	if (body.effective_from !== undefined) {
		const effectiveFromError = validateEffectiveFrom(body.effective_from);
		if (effectiveFromError) {
			errors.push({ field: 'effective_from', message: effectiveFromError });
		} else {
			effectiveFromStr = body.effective_from as string;
			validatedData.effective_from = effectiveFromStr;
		}
	}

	// Validate effective_to if provided
	if (body.effective_to !== undefined) {
		if (body.effective_to === null || body.effective_to === '') {
			validatedData.effective_to = null;
		} else if (typeof body.effective_to !== 'string') {
			errors.push({ field: 'effective_to', message: 'effective_to must be a date string or null' });
		} else {
			const d = new Date(body.effective_to);
			if (isNaN(d.getTime())) {
				errors.push({ field: 'effective_to', message: 'effective_to must be a valid date' });
			} else {
				// Cross-field: only check range when we have a valid effective_from to compare against
				const fromForComparison = effectiveFromStr ?? (body.effective_from as string | undefined);
				if (fromForComparison) {
					const rangeError = validateEffectiveDateRange(fromForComparison, body.effective_to);
					if (rangeError) {
						errors.push({ field: 'effective_to', message: rangeError });
					}
				}
				if (!errors.some((e) => e.field === 'effective_to')) {
					validatedData.effective_to = body.effective_to;
				}
			}
		}
	}

	// Validate status if provided
	if (body.status !== undefined) {
		if (body.status === null) {
			errors.push({ field: 'status', message: 'status cannot be null' });
		} else if (typeof body.status !== 'boolean') {
			errors.push({ field: 'status', message: 'status must be a boolean' });
		} else {
			validatedData.status = body.status;
		}
	}

	// Validate components if provided
	if (body.components !== undefined) {
		const componentsValid = validateComponents(body.components, errors);
		if (componentsValid) {
			const rawComponents = body.components as Array<Record<string, unknown>>;
			validatedData.components = rawComponents.map((item) => ({
				salary_component_cuid: (item.salary_component_cuid as string).trim(),
				amount: item.amount as number
			}));
		}
	}

	// Validate confirmAdjustment if provided
	if (body.confirmAdjustment !== undefined) {
		if (body.confirmAdjustment !== null && typeof body.confirmAdjustment === 'boolean') {
			validatedData.confirmAdjustment = body.confirmAdjustment;
		} else {
			errors.push({ field: 'confirmAdjustment', message: 'confirmAdjustment must be a boolean' });
		}
	}

	if (errors.length > 0) {
		return { errors };
	}

	return { errors: [], validatedData };
}

// ─── Create Revision validator ────────────────────────────────────────────────

export function validateCreateRevision(data: unknown): {
	errors: ValidationError[];
	validatedData?: CreateRevisionDto;
} {
	const errors: ValidationError[] = [];

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { errors: [{ field: 'body', message: 'Invalid request body' }] };
	}

	const body = data as Record<string, unknown>;

	// Reject unknown top-level fields
	const unknownKeys = findUnknownKeys(body, REVISION_ALLOWED_KEYS);
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

	// Validate effective_from (required)
	const effectiveFromError = validateEffectiveFrom(body.effective_from);
	if (effectiveFromError) {
		errors.push({ field: 'effective_from', message: effectiveFromError });
	}

	// Validate components (required)
	const componentsValid = validateComponents(body.components, errors);

	if (errors.length > 0) {
		return { errors };
	}

	if (!componentsValid) {
		return { errors };
	}

	const rawComponents = body.components as Array<Record<string, unknown>>;

	return {
		errors: [],
		validatedData: {
			effective_from: body.effective_from as string,
			components: rawComponents.map((item) => ({
				salary_component_cuid: (item.salary_component_cuid as string).trim(),
				amount: item.amount as number
			}))
		}
	};
}
