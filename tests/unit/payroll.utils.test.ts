import { describe, it, expect } from 'vitest';
import { isDeductionComponent, getEarningsAndDeductions } from '$lib/utils/payroll.js';

describe('Payroll Utils — Component Classification', () => {
	describe('isDeductionComponent', () => {
		it('should treat "Others" as a deduction', () => {
			expect(isDeductionComponent('Others')).toBe(true);
			expect(isDeductionComponent('others')).toBe(true);
			expect(isDeductionComponent('  Others  ')).toBe(true);
		});

		it('should treat "Other" as a deduction', () => {
			expect(isDeductionComponent('Other')).toBe(true);
			expect(isDeductionComponent('other')).toBe(true);
			expect(isDeductionComponent('  Other  ')).toBe(true);
		});

		it('should treat "Others Deduction" as a deduction', () => {
			expect(isDeductionComponent('Others Deduction')).toBe(true);
			expect(isDeductionComponent('others deduction')).toBe(true);
		});

		it('should treat standard deduction components (PF, ESI, Professional Tax, Meal Pass) as deductions', () => {
			expect(isDeductionComponent('PF')).toBe(true);
			expect(isDeductionComponent('Provident Fund')).toBe(true);
			expect(isDeductionComponent('Professional Tax')).toBe(true);
			expect(isDeductionComponent('ESI')).toBe(true);
			expect(isDeductionComponent('Income Tax')).toBe(true);
			expect(isDeductionComponent('Meal Pass')).toBe(true);
		});

		it('should NOT treat standard earning components (Basic, HRA, Special Allowance, Other Allowance) as deductions', () => {
			expect(isDeductionComponent('Basic')).toBe(false);
			expect(isDeductionComponent('HRA')).toBe(false);
			expect(isDeductionComponent('Special Allowance')).toBe(false);
			expect(isDeductionComponent('Other Allowance')).toBe(false);
		});
	});

	describe('getEarningsAndDeductions', () => {
		it('should correctly classify a mixed payroll breakdown', () => {
			const breakdown = {
				Basic: 50000,
				HRA: 20000,
				PF: 6000,
				ESI: 500,
				'Professional Tax': 200,
				Others: 1000,
				'Other Allowance': 3000
			};

			const { earnings, deductions } = getEarningsAndDeductions(breakdown);

			// Expected earnings: Basic, HRA, Other Allowance
			const earningNames = earnings.map(([name]) => name);
			expect(earningNames).toContain('Basic');
			expect(earningNames).toContain('HRA');
			expect(earningNames).toContain('Other Allowance');
			expect(earningNames).not.toContain('PF');
			expect(earningNames).not.toContain('Others');

			// Expected deductions: PF, ESI, Professional Tax, Others
			const deductionNames = deductions.map(([name]) => name);
			expect(deductionNames).toContain('PF');
			expect(deductionNames).toContain('ESI');
			expect(deductionNames).toContain('Professional Tax');
			expect(deductionNames).toContain('Others');
			expect(deductionNames).not.toContain('Basic');
			expect(deductionNames).not.toContain('Other Allowance');
		});
	});
});
