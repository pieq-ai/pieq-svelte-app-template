import { describe, it, expect } from 'vitest';
import {
	validateCreateSalaryStructure,
	validateUpdateSalaryStructure
} from '$lib/server/validators/salary-structure.validator.js';

// ─── Helper builders ──────────────────────────────────────────────────────────

function validCreateBody() {
	return {
		employee_cuid: 'EMP001',
		effective_from: '2024-01-01',
		components: [{ salary_component_cuid: 'comp_abc123', amount: 5000 }]
	};
}

function validUpdateBody() {
	return {
		effective_from: '2024-06-01'
	};
}

// ─── CREATE validator ─────────────────────────────────────────────────────────

describe('validateCreateSalaryStructure', () => {
	it('should return no errors for a valid payload', () => {
		const { errors, validatedData } = validateCreateSalaryStructure(validCreateBody());
		expect(errors).toHaveLength(0);
		expect(validatedData).toBeDefined();
		expect(validatedData?.employee_cuid).toBe('EMP001');
		expect(validatedData?.components).toHaveLength(1);
		expect(validatedData?.components[0].amount).toBe(5000);
	});

	it('should set status to true by default when not provided', () => {
		const { validatedData } = validateCreateSalaryStructure(validCreateBody());
		expect(validatedData?.status).toBe(true);
	});

	it('should accept an explicit effective_to date after effective_from', () => {
		const body = { ...validCreateBody(), effective_to: '2024-12-31' };
		const { errors, validatedData } = validateCreateSalaryStructure(body);
		expect(errors).toHaveLength(0);
		expect(validatedData?.effective_to).toBe('2024-12-31');
	});

	it('should reject effective_to that is before effective_from', () => {
		const body = { ...validCreateBody(), effective_to: '2023-06-01' }; // before 2024-01-01
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'effective_to' && e.message.includes('greater'))).toBe(true);
	});

	it('should reject effective_to equal to effective_from', () => {
		const body = { ...validCreateBody(), effective_to: '2024-01-01' }; // same day
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'effective_to' && e.message.includes('greater'))).toBe(true);
	});

	it('should treat empty string effective_to as null', () => {
		const body = { ...validCreateBody(), effective_to: '' };
		const { validatedData } = validateCreateSalaryStructure(body);
		expect(validatedData?.effective_to).toBeNull();
	});

	it('should reject missing employee_cuid', () => {
		const body = { ...validCreateBody(), employee_cuid: '' };
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'employee_cuid')).toBe(true);
	});

	it('should reject missing effective_from', () => {
		const body = { ...validCreateBody(), effective_from: '' };
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'effective_from')).toBe(true);
	});

	it('should reject an invalid effective_from date string', () => {
		const body = { ...validCreateBody(), effective_from: 'not-a-date' };
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'effective_from')).toBe(true);
	});

	it('should reject empty components array', () => {
		const body = { ...validCreateBody(), components: [] };
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'components')).toBe(true);
	});

	it('should reject when components is not an array', () => {
		const body = { ...validCreateBody(), components: 'not-an-array' };
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'components')).toBe(true);
	});

	it('should reject duplicate salary_component_cuid in components', () => {
		const body = {
			...validCreateBody(),
			components: [
				{ salary_component_cuid: 'comp_abc', amount: 1000 },
				{ salary_component_cuid: 'comp_abc', amount: 2000 }
			]
		};
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
	});

	it('should reject a negative amount', () => {
		const body = {
			...validCreateBody(),
			components: [{ salary_component_cuid: 'comp_abc', amount: -100 }]
		};
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field.includes('amount'))).toBe(true);
	});

	it('should allow zero amount', () => {
		const body = {
			...validCreateBody(),
			components: [{ salary_component_cuid: 'comp_abc', amount: 0 }]
		};
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors).toHaveLength(0); // 0 is allowed
	});

	it('should reject unknown top-level keys', () => {
		const body = { ...validCreateBody(), unknownField: 'surprise' };
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.message.includes('Unknown field'))).toBe(true);
	});

	it('should reject the old "items" key (renamed to "components")', () => {
		const body = { ...validCreateBody(), items: [] };
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.message.includes('Unknown field'))).toBe(true);
	});

	it('should reject unknown component-level keys', () => {
		const body = {
			...validCreateBody(),
			components: [{ salary_component_cuid: 'comp_abc', amount: 500, hack: 'xss' }]
		};
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.message.includes('Unknown field'))).toBe(true);
	});

	it('should reject a null / undefined body', () => {
		const { errors } = validateCreateSalaryStructure(null);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('should reject a non-object body (string)', () => {
		const { errors } = validateCreateSalaryStructure('string');
		expect(errors.length).toBeGreaterThan(0);
	});

	it('should reject missing salary_component_cuid on a component', () => {
		const body = {
			...validCreateBody(),
			components: [{ salary_component_cuid: '', amount: 500 }]
		};
		const { errors } = validateCreateSalaryStructure(body);
		expect(errors.some((e) => e.field.includes('salary_component_cuid'))).toBe(true);
	});
});

// ─── UPDATE validator ─────────────────────────────────────────────────────────

describe('validateUpdateSalaryStructure', () => {
	it('should return no errors for a valid partial payload', () => {
		const { errors, validatedData } = validateUpdateSalaryStructure(validUpdateBody());
		expect(errors).toHaveLength(0);
		expect(validatedData?.effective_from).toBe('2024-06-01');
	});

	it('should reject an empty body', () => {
		const { errors } = validateUpdateSalaryStructure({});
		expect(errors.some((e) => e.message.includes('at least one valid field'))).toBe(true);
	});

	it('should reject unknown top-level keys', () => {
		const body = { ...validUpdateBody(), alien: true };
		const { errors } = validateUpdateSalaryStructure(body);
		expect(errors.some((e) => e.message.includes('Unknown field'))).toBe(true);
	});

	it('should reject the old "items" key', () => {
		const body = { items: [{ salary_component_cuid: 'c', amount: 100 }] };
		const { errors } = validateUpdateSalaryStructure(body);
		expect(errors.some((e) => e.message.includes('Unknown field'))).toBe(true);
	});

	it('should accept a valid components update', () => {
		const body = {
			components: [
				{ salary_component_cuid: 'comp_x', amount: 3000 },
				{ salary_component_cuid: 'comp_y', amount: 1500 }
			]
		};
		const { errors, validatedData } = validateUpdateSalaryStructure(body);
		expect(errors).toHaveLength(0);
		expect(validatedData?.components).toHaveLength(2);
	});

	it('should reject duplicate components in update', () => {
		const body = {
			components: [
				{ salary_component_cuid: 'comp_dup', amount: 100 },
				{ salary_component_cuid: 'comp_dup', amount: 200 }
			]
		};
		const { errors } = validateUpdateSalaryStructure(body);
		expect(errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
	});

	it('should reject effective_to before effective_from in update', () => {
		const body = { effective_from: '2024-06-01', effective_to: '2024-01-01' };
		const { errors } = validateUpdateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'effective_to' && e.message.includes('greater'))).toBe(true);
	});

	it('should reject status as null', () => {
		const body = { status: null };
		const { errors } = validateUpdateSalaryStructure(body);
		expect(errors.some((e) => e.field === 'status')).toBe(true);
	});

	it('should accept setting effective_to to null', () => {
		const body = { effective_to: null };
		const { errors, validatedData } = validateUpdateSalaryStructure(body);
		expect(errors).toHaveLength(0);
		expect(validatedData?.effective_to).toBeNull();
	});

	it('should reject non-object body', () => {
		const { errors } = validateUpdateSalaryStructure(42);
		expect(errors.length).toBeGreaterThan(0);
	});
});
