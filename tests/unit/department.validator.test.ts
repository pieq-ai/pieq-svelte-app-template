import { describe, it, expect } from 'vitest';
import { validateDepartmentName } from './department.validator.js';

describe('validateDepartmentName', () => {
	it('should return a title-cased valid string', () => {
		expect(validateDepartmentName('human resources')).toBe('Human Resources');
		expect(validateDepartmentName('IT')).toBe('It');
		expect(validateDepartmentName('research and development')).toBe('Research And Development');
	});

	it('should collapse multiple spaces and title case correctly', () => {
		expect(validateDepartmentName('  human    resources  ')).toBe('Human Resources');
	});

	it('should throw an error if the name is undefined or null', () => {
		expect(() => validateDepartmentName(undefined)).toThrow('Department name is required');
		expect(() => validateDepartmentName(null)).toThrow('Department name is required');
	});

	it('should throw an error if the name is an empty string or just whitespace', () => {
		expect(() => validateDepartmentName('')).toThrow('Department name is required');
		expect(() => validateDepartmentName('   ')).toThrow('Department name is required');
	});

	it('should throw an error if the name is less than 2 characters long', () => {
		expect(() => validateDepartmentName('A')).toThrow('Department name must be at least 2 characters long');
	});

	it('should throw an error if the name exceeds 100 characters', () => {
		const longName = 'A'.repeat(101);
		expect(() => validateDepartmentName(longName)).toThrow('Department name cannot exceed 100 characters');
	});

	it('should throw an error if the name contains invalid characters', () => {
		expect(() => validateDepartmentName('IT Department 123')).toThrow('Department name must contain only letters and spaces');
		expect(() => validateDepartmentName('R&D')).toThrow('Department name must contain only letters and spaces');
		expect(() => validateDepartmentName('Engineering-Team')).toThrow('Department name must contain only letters and spaces');
	});
});
