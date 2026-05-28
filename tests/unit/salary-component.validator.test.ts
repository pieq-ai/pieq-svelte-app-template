import { describe, expect, it } from 'vitest';
import {
	validateCreateSalaryComponent,
	validateUpdateSalaryComponent
} from '$lib/server/validators/salary-component.validator.js';

describe('salary-component.validator', () => {
	describe('validateCreateSalaryComponent', () => {
		it('should pass on valid input', () => {
			const res = validateCreateSalaryComponent({
				component_name: 'Basic Pay',
				component_type: 'earning',
				is_taxable: true,
				status: 'active'
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				component_name: 'Basic Pay',
				component_type: 'earning',
				is_taxable: true,
				status: 'active'
			});
		});

		it('should trim name, type, status, and set defaults for is_taxable and status', () => {
			const res = validateCreateSalaryComponent({
				component_name: '  HRA  ',
				component_type: ' earning  '
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				component_name: 'HRA',
				component_type: 'earning',
				is_taxable: false,
				status: 'active'
			});
		});

		it('should fail on empty or whitespace-only name', () => {
			const res1 = validateCreateSalaryComponent({
				component_name: '',
				component_type: 'earning'
			});
			expect(res1.errors).toContainEqual({
				field: 'component_name',
				message: 'Component name is required'
			});

			const res2 = validateCreateSalaryComponent({
				component_name: '    ',
				component_type: 'earning'
			});
			expect(res2.errors).toContainEqual({
				field: 'component_name',
				message: 'Component name is required'
			});
		});

		it('should fail on too short or too long name', () => {
			const resShort = validateCreateSalaryComponent({
				component_name: 'A',
				component_type: 'earning'
			});
			expect(resShort.errors).toContainEqual({
				field: 'component_name',
				message: 'Component name is too short'
			});

			const resLong = validateCreateSalaryComponent({
				component_name: 'A'.repeat(151),
				component_type: 'earning'
			});
			expect(resLong.errors).toContainEqual({
				field: 'component_name',
				message: 'Component name is too long'
			});
		});

		it('should fail on invalid special characters in name', () => {
			const resSpecial = validateCreateSalaryComponent({
				component_name: 'Basic @ Pay #1',
				component_type: 'earning'
			});
			expect(resSpecial.errors).toContainEqual({
				field: 'component_name',
				message: 'Special characters are not allowed'
			});
		});

		it('should reject underscores in name', () => {
			const resUnderscore = validateCreateSalaryComponent({
				component_name: 'HRA_Pay',
				component_type: 'earning'
			});
			expect(resUnderscore.errors).toContainEqual({
				field: 'component_name',
				message: 'Special characters are not allowed'
			});
		});

		it('should allow hyphens, ampersands, and parentheses in name', () => {
			const resSafe = validateCreateSalaryComponent({
				component_name: 'HRA - & (Provident Fund)',
				component_type: 'earning'
			});
			expect(resSafe.errors).toHaveLength(0);
			expect(resSafe.validatedData?.component_name).toBe('HRA - & (Provident Fund)');
		});

		it('should fail on multiple consecutive spaces', () => {
			const resMultipleSpaces = validateCreateSalaryComponent({
				component_name: 'Basic  Pay',
				component_type: 'earning'
			});
			expect(resMultipleSpaces.errors).toContainEqual({
				field: 'component_name',
				message: 'Multiple consecutive spaces are not allowed'
			});
		});

		it('should fail on invalid component_type', () => {
			const res = validateCreateSalaryComponent({
				component_name: 'Basic Pay',
				component_type: 'invalid-type'
			});
			expect(res.errors).toContainEqual({
				field: 'component_type',
				message: 'Component type must be either "earning" or "deduction"'
			});
		});

		it('should fail on invalid status', () => {
			const res = validateCreateSalaryComponent({
				component_name: 'Basic Pay',
				component_type: 'earning',
				status: 'deleted'
			});
			expect(res.errors).toContainEqual({
				field: 'status',
				message: 'Status must be either "active" or "inactive"'
			});
		});
	});

	describe('validateUpdateSalaryComponent', () => {
		it('should pass on valid partial updates', () => {
			const res = validateUpdateSalaryComponent({
				component_name: 'New Basic Pay',
				is_taxable: false
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				component_name: 'New Basic Pay',
				is_taxable: false
			});
		});

		it('should validate status update', () => {
			const res = validateUpdateSalaryComponent({
				status: 'inactive'
			});
			expect(res.errors).toHaveLength(0);
			expect(res.validatedData).toEqual({
				status: 'inactive'
			});
		});

		it('should fail on invalid status in update', () => {
			const res = validateUpdateSalaryComponent({
				status: 'archived'
			});
			expect(res.errors).toContainEqual({
				field: 'status',
				message: 'Status must be either "active" or "inactive"'
			});
		});

		it('should fail on invalid name format in update', () => {
			const res = validateUpdateSalaryComponent({
				component_name: 'HRA$'
			});
			expect(res.errors).toContainEqual({
				field: 'component_name',
				message: 'Special characters are not allowed'
			});
		});
	});
});
