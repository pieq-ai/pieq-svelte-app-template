/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
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
		it('should fetch employees correctly', async () => {
			const mockEmployees = [
				{
					id: 1n,
					uuid: 'emp123',
					name: 'John Doe',
					age: 25
				},
				{
					id: 2n,
					uuid: 'emp456',
					name: 'Jane Smith',
					age: 30
				}
			];
			vi.mocked(db.employee.findMany).mockResolvedValue(mockEmployees as any);

			const result = await employeeDao.list();

			expect(db.employee.findMany).toHaveBeenCalledWith({
				orderBy: { id: 'asc' }
			});
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(mockEmployees[0]);
			expect(result[1]).toEqual(mockEmployees[1]);
		});
	});

	describe('create', () => {
		it('should create an employee correctly', async () => {
			const input = { name: 'Alice Wonderland', age: 30 };
			const mockCreated = {
				id: 3n,
				uuid: 'newemp1',
				name: 'Alice Wonderland',
				age: 30
			};
			vi.mocked(db.employee.create).mockResolvedValue(mockCreated as any);

			const result = await employeeDao.create(input);

			expect(db.employee.create).toHaveBeenCalledTimes(1);
			expect(db.employee.create).toHaveBeenCalledWith({
				data: {
					name: 'Alice Wonderland',
					age: 30
				}
			});

			expect(result).toEqual(mockCreated);
		});
	});
});
