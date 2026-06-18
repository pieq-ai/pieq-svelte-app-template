 
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
			const mockDbEmployees = [
				{
					id: 1,
					cuid: 'emp123',
					first_name: 'John',
					last_name: 'Doe',
					dob: new Date(new Date().getFullYear() - 25, 5, 15)
				},
				{
					id: 2,
					cuid: 'emp456',
					first_name: 'Jane',
					last_name: 'Smith',
					dob: new Date(new Date().getFullYear() - 30, 5, 15)
				}
			];
			vi.mocked(db.employee.findMany).mockResolvedValue(mockDbEmployees as any);

			const result = await employeeDao.list();

			expect(db.employee.findMany).toHaveBeenCalledWith({
				orderBy: { id: 'asc' }
			});
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: 1,
				uuid: 'emp123',
				name: 'John Doe',
				age: 25
			});
			expect(result[1]).toEqual({
				id: 2,
				uuid: 'emp456',
				name: 'Jane Smith',
				age: 30
			});
		});
	});

	describe('create', () => {
		it('should create an employee correctly', async () => {
			const input = { name: 'Alice Wonderland', age: 30 };
			const dobDate = new Date(new Date().getFullYear() - 30, 0, 1);
			const mockCreated = {
				id: 3,
				cuid: 'newemp1',
				first_name: 'Alice',
				last_name: 'Wonderland',
				dob: dobDate
			};
			vi.mocked(db.employee.create).mockResolvedValue(mockCreated as any);

			const result = await employeeDao.create(input);

			expect(db.employee.create).toHaveBeenCalledTimes(1);
			expect(db.employee.create).toHaveBeenCalledWith({
				data: {
					emp_code: expect.any(String),
					first_name: 'Alice',
					last_name: 'Wonderland',
					dob: expect.any(Date),
					profile_completion_status: 'pending'
				}
			});

			expect(result).toEqual({
				id: 3,
				uuid: 'newemp1',
				name: 'Alice Wonderland',
				age: 30
			});
		});
	});
});
