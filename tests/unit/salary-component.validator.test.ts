import { describe, expect, it } from 'vitest';
import {
	validateCreateSalaryComponent,
	validateUpdateSalaryComponent
} from '$lib/server/validators/salary-component.validator.js';

describe('salary-component.validator', () => {
	describe('validateCreateSalaryComponent', () => {
		it('should pass on valid input', () => {
			const res = validateCreateSalaryComponent({
				name: 'Basic Pay',
				type: 'earning',
				is_taxable: true,
				status: true
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				name: 'Basic Pay',
				type: 'earning',
				is_taxable: true,
				status: true
			});
		});

		it('should trim name, type, status, and set defaults for is_taxable and status', () => {
			const res = validateCreateSalaryComponent({
				name: '  HRA  ',
				type: ' earning  '
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				name: 'HRA',
				type: 'earning',
				is_taxable: false,
				status: true
			});
		});

		it('should fail on empty or whitespace-only name', () => {
			const res1 = validateCreateSalaryComponent({
				name: '',
				type: 'earning'
			});
			expect(res1.errors).toContainEqual({
				field: 'name',
				message: 'Component name is required'
			});

			const res2 = validateCreateSalaryComponent({
				name: '    ',
				type: 'earning'
			});
			expect(res2.errors).toContainEqual({
				field: 'name',
				message: 'Component name is required'
			});
		});

		it('should fail on too short or too long name', () => {
			const resShort = validateCreateSalaryComponent({
				name: 'A',
				type: 'earning'
			});
			expect(resShort.errors).toContainEqual({
				field: 'name',
				message: 'Component name is too short'
			});

			const resLong = validateCreateSalaryComponent({
				name: 'A'.repeat(151),
				type: 'earning'
			});
			expect(resLong.errors).toContainEqual({
				field: 'name',
				message: 'Component name is too long'
			});
		});

		it('should fail on invalid special characters in name', () => {
			const resSpecial = validateCreateSalaryComponent({
				name: 'Basic @ Pay #1',
				type: 'earning'
			});
			expect(resSpecial.errors).toContainEqual({
				field: 'name',
				message: 'Special characters are not allowed'
			});
		});

		it('should reject underscores in name', () => {
			const resUnderscore = validateCreateSalaryComponent({
				name: 'HRA_Pay',
				type: 'earning'
			});
			expect(resUnderscore.errors).toContainEqual({
				field: 'name',
				message: 'Special characters are not allowed'
			});
		});

		it('should allow hyphens, ampersands, and parentheses in name', () => {
			const resSafe = validateCreateSalaryComponent({
				name: 'HRA - & (Provident Fund)',
				type: 'earning'
			});
			expect(resSafe.errors).toHaveLength(0);
			expect(resSafe.validatedData?.name).toBe('HRA - & (Provident Fund)');
		});

		it('should fail on multiple consecutive spaces', () => {
			const resMultipleSpaces = validateCreateSalaryComponent({
				name: 'Basic  Pay',
				type: 'earning'
			});
			expect(resMultipleSpaces.errors).toContainEqual({
				field: 'name',
				message: 'Multiple consecutive spaces are not allowed'
			});
		});

		it('should fail on invalid type', () => {
			const res = validateCreateSalaryComponent({
				name: 'Basic Pay',
				type: 'invalid-type'
			});
			expect(res.errors).toContainEqual({
				field: 'type',
				message: 'Component type must be either "earning" or "deduction"'
			});
		});

		it('should fail on invalid status', () => {
			const res = validateCreateSalaryComponent({
				name: 'Basic Pay',
				type: 'earning',
				status: 'deleted'
			});
			expect(res.errors).toContainEqual({
				field: 'status',
				message: 'status must be a boolean'
			});
		});

		// ----- NEW: Unknown field rejection tests -----

		it('should reject unknown fields in create body', () => {
			const res = validateCreateSalaryComponent({
				name: 'Basic Pay',
				type: 'earning',
				unknown_field: 'oops'
			});
			expect(res.errors).toHaveLength(1);
			expect(res.errors[0].field).toBe('body');
			expect(res.errors[0].message).toMatch(/unknown field/i);
			expect(res.errors[0].message).toContain('unknown_field');
		});

		it('should reject multiple unknown fields in create body', () => {
			const res = validateCreateSalaryComponent({
				name: 'Basic Pay',
				type: 'earning',
				foo: 'bar',
				baz: 123
			});
			expect(res.errors).toHaveLength(1);
			expect(res.errors[0].field).toBe('body');
			expect(res.errors[0].message).toContain('foo');
			expect(res.errors[0].message).toContain('baz');
		});

		it('should reject arrays as the request body', () => {
			const res = validateCreateSalaryComponent([{ name: 'Basic Pay' }]);
			expect(res.errors).toHaveLength(1);
			expect(res.errors[0].field).toBe('body');
		});

		it('should reject non-boolean is_taxable in create', () => {
			const res = validateCreateSalaryComponent({
				name: 'Basic Pay',
				type: 'earning',
				is_taxable: 'yes'
			});
			expect(res.errors).toContainEqual({
				field: 'is_taxable',
				message: 'is_taxable must be a boolean'
			});
		});
	});

	describe('validateUpdateSalaryComponent', () => {
		it('should pass on valid partial updates', () => {
			const res = validateUpdateSalaryComponent({
				name: 'New Basic Pay',
				is_taxable: false
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				name: 'New Basic Pay',
				is_taxable: false
			});
		});

		it('should validate status update', () => {
			const res = validateUpdateSalaryComponent({
				status: false
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				status: false
			});
		});

		it('should fail on invalid status in update', () => {
			const res = validateUpdateSalaryComponent({
				status: 'archived'
			});
			expect(res.errors).toContainEqual({
				field: 'status',
				message: 'status must be a boolean'
			});
		});

		it('should fail on invalid name format in update', () => {
			const res = validateUpdateSalaryComponent({
				name: 'HRA$'
			});
			expect(res.errors).toContainEqual({
				field: 'name',
				message: 'Special characters are not allowed'
			});
		});

		// ----- NEW: Unknown field rejection tests -----

		it('should reject unknown fields in update body', () => {
			const res = validateUpdateSalaryComponent({
				name: 'HRA',
				extra_key: true
			});
			expect(res.errors).toHaveLength(1);
			expect(res.errors[0].field).toBe('body');
			expect(res.errors[0].message).toMatch(/unknown field/i);
			expect(res.errors[0].message).toContain('extra_key');
		});

		it('should reject multiple unknown fields in update body', () => {
			const res = validateUpdateSalaryComponent({
				status: true,
				salary: 50000,
				deleted: false
			});
			expect(res.errors).toHaveLength(1);
			expect(res.errors[0].field).toBe('body');
			expect(res.errors[0].message).toContain('salary');
			expect(res.errors[0].message).toContain('deleted');
		});

		it('should reject empty update body', () => {
			const res = validateUpdateSalaryComponent({});
			expect(res.errors).toHaveLength(1);
			expect(res.errors[0].field).toBe('body');
			expect(res.errors[0].message).toMatch(/at least one/i);
		});

		it('should reject arrays as the update body', () => {
			const res = validateUpdateSalaryComponent([{ status: false }]);
			expect(res.errors).toHaveLength(1);
			expect(res.errors[0].field).toBe('body');
		});

		it('should reject non-boolean is_taxable in update', () => {
			const res = validateUpdateSalaryComponent({
				is_taxable: 1
			});
			expect(res.errors).toContainEqual({
				field: 'is_taxable',
				message: 'is_taxable must be a boolean'
			});
		});
	});
});
