import { describe, expect, it } from 'vitest';
import { trimStringFields, validatePayloadKeys } from '$lib/server/validation.js';

describe('validation utilities', () => {
	describe('trimStringFields', () => {
		it('should trim string values at the top level', () => {
			expect(trimStringFields('  hello  ')).toBe('hello');
			expect(trimStringFields('world')).toBe('world');
		});

		it('should recursively trim string values inside an object', () => {
			const input = {
				name: '  John Doe  ',
				age: 30,
				address: {
					city: '   New York   ',
					zip: '10001'
				}
			};
			const expected = {
				name: 'John Doe',
				age: 30,
				address: {
					city: 'New York',
					zip: '10001'
				}
			};
			expect(trimStringFields(input)).toEqual(expected);
		});

		it('should trim string values inside arrays', () => {
			const input = ['  apple  ', 'banana', 123, { label: '  orange  ' }];
			const expected = ['apple', 'banana', 123, { label: 'orange' }];
			expect(trimStringFields(input)).toEqual(expected);
		});

		it('should handle null and undefined safely', () => {
			expect(trimStringFields(null)).toBe(null);
			expect(trimStringFields(undefined)).toBe(undefined);
		});

		it('should preserve boolean and number types', () => {
			expect(trimStringFields(true)).toBe(true);
			expect(trimStringFields(42)).toBe(42);
		});
	});

	describe('validatePayloadKeys', () => {
		const allowedKeys = ['name', 'description', 'status'];

		it('should return null when all keys are allowed', () => {
			const body = { name: 'Leave Type', status: true };
			expect(validatePayloadKeys(body, allowedKeys)).toBeNull();
		});

		it('should return null for empty body object', () => {
			expect(validatePayloadKeys({}, allowedKeys)).toBeNull();
		});

		it('should return error when body contains unexpected keys', () => {
			const body = { name: 'Leave Type', extra: 'value' };
			const result = validatePayloadKeys(body, allowedKeys);
			expect(result).toEqual({
				error: 'Invalid, unexpected or misspelled key: "extra"'
			});
		});

		it('should return error when body contains misspelled keys', () => {
			const body = { nmae: 'Leave Type' };
			const result = validatePayloadKeys(body, allowedKeys);
			expect(result).toEqual({
				error: 'Invalid, unexpected or misspelled key: "nmae"'
			});
		});

		it('should return error when body is null or undefined', () => {
			expect(validatePayloadKeys(null, allowedKeys)).toEqual({
				error: 'Request body must be a valid JSON object'
			});
			expect(validatePayloadKeys(undefined, allowedKeys)).toEqual({
				error: 'Request body must be a valid JSON object'
			});
		});

		it('should return error when body is an array or primitive', () => {
			expect(validatePayloadKeys([], allowedKeys)).toEqual({
				error: 'Request body must be a valid JSON object'
			});
			expect(validatePayloadKeys('not an object', allowedKeys)).toEqual({
				error: 'Request body must be a valid JSON object'
			});
		});
	});
});
