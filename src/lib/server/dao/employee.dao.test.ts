/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as employeeDao from './employee.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			employee: {
				findMany: vi.fn(),
				create: vi.fn()
			}
		}
	};
});

describe('Employee DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it('should fetch employees and transform data correctly', async () => {
			const currentYear = new Date().getFullYear();
			const mockEmployees = [
				{
					cuid: 'emp123',
					first_name: 'John',
					last_name: 'Doe',
					dob: new Date(currentYear - 25, 5, 15) // 25 years old
				},
				{
					cuid: 'emp456',
					first_name: 'Jane',
					last_name: 'Smith',
					dob: null // Missing DOB, fallback age 30
				}
			];
			vi.mocked(db.employee.findMany).mockResolvedValue(mockEmployees as any);

			const result = await employeeDao.list();

			expect(db.employee.findMany).toHaveBeenCalledWith({
				orderBy: { id: 'asc' }
			});
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				cuid: 'emp123',
				name: 'John Doe',
				age: 25
			});
			expect(result[1]).toEqual({
				cuid: 'emp456',
				name: 'Jane Smith',
				age: 30
			});
		});

		it('should handle db errors gracefully and return an empty array', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			vi.mocked(db.employee.findMany).mockRejectedValue(new Error('Connection failed'));

			const result = await employeeDao.list();

			expect(db.employee.findMany).toHaveBeenCalled();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error fetching employees from database:',
				expect.any(Error)
			);
			expect(result).toEqual([]);

			consoleErrorSpy.mockRestore();
		});
	});

	describe('create', () => {
		it('should create an employee correctly with split name and random fields', async () => {
			const currentYear = new Date().getFullYear();
			const input = { name: 'Alice Wonderland', age: 30 };
			const mockCreated = {
				cuid: 'newemp1',
				first_name: 'Alice',
				last_name: 'Wonderland'
			};
			vi.mocked(db.employee.create).mockResolvedValue(mockCreated as any);

			const result = await employeeDao.create(input);

			expect(db.employee.create).toHaveBeenCalledTimes(1);
			const callArgs = vi.mocked(db.employee.create).mock.calls[0][0];

			expect(callArgs.data.first_name).toBe('Alice');
			expect(callArgs.data.last_name).toBe('Wonderland');
			expect(callArgs.data.dob).toEqual(new Date(currentYear - 30, 0, 1));
			expect(callArgs.data.gender).toBe('Male');
			expect(callArgs.data.emp_code).toMatch(/^EMP-\d+-\d+$/);

			expect(result).toEqual({
				cuid: 'newemp1',
				name: 'Alice Wonderland',
				age: 30
			});
		});

		it('should handle name without spaces (only first name)', async () => {
			const input = { name: 'Bob', age: 40 };
			const mockCreated = {
				cuid: 'newemp2',
				first_name: 'Bob',
				last_name: 'Employee'
			};
			vi.mocked(db.employee.create).mockResolvedValue(mockCreated as any);

			const result = await employeeDao.create(input);

			const callArgs = vi.mocked(db.employee.create).mock.calls[0][0];
			expect(callArgs.data.first_name).toBe('Bob');
			expect(callArgs.data.last_name).toBe('Employee');

			expect(result.name).toBe('Bob Employee');
		});

		it('should handle empty name strings', async () => {
			const input = { name: '   ', age: 20 };
			const mockCreated = {
				cuid: 'newemp3',
				first_name: 'Unknown',
				last_name: 'Employee'
			};
			vi.mocked(db.employee.create).mockResolvedValue(mockCreated as any);

			await employeeDao.create(input);

			const callArgs = vi.mocked(db.employee.create).mock.calls[0][0];
			expect(callArgs.data.first_name).toBe('Unknown');
			expect(callArgs.data.last_name).toBe('Employee');
		});
	});
});
