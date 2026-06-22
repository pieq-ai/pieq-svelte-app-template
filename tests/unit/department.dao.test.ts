import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as departmentDao from '$lib/server/dao/department.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			department: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				findFirst: vi.fn(),
				create: vi.fn(),
				update: vi.fn()
			}
		}
	};
});

describe('Department DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it('should call db.department.findMany with order by name', async () => {
			const mockData = [{ id: 1, name: 'IT' }];
			vi.mocked(db.department.findMany).mockResolvedValue(mockData as never);

			const result = await departmentDao.list();

			expect(db.department.findMany).toHaveBeenCalledWith({
				orderBy: { name: 'asc' }
			});
			expect(result).toBe(mockData);
		});

		it('should handle errors thrown by database', async () => {
			vi.mocked(db.department.findMany).mockRejectedValue(new Error('DB connection failed'));
			await expect(departmentDao.list()).rejects.toThrow('DB connection failed');
		});
	});

	describe('findByCuid2', () => {
		it('should call db.department.findUnique with correct cuid', async () => {
			const mockData = { id: 1n, cuid: 'abc1234' };
			vi.mocked(db.department.findUnique).mockResolvedValue(mockData as never);

			const result = await departmentDao.findByCuid2('abc1234');

			expect(db.department.findUnique).toHaveBeenCalledWith({
				where: { cuid: 'abc1234' }
			});
			expect(result).toBe(mockData);
		});

		it('should return null if not found', async () => {
			vi.mocked(db.department.findUnique).mockResolvedValue(null);
			const result = await departmentDao.findByCuid2('non-existent');
			expect(result).toBeNull();
		});
	});

	describe('findByName', () => {
		it('should call db.department.findFirst with case-insensitive search', async () => {
			const mockData = { id: 1, name: 'Human Resources' };
			vi.mocked(db.department.findFirst).mockResolvedValue(mockData as never);

			const result = await departmentDao.findByName('human resources');

			expect(db.department.findFirst).toHaveBeenCalledWith({
				where: {
					name: {
						equals: 'human resources',
						mode: 'insensitive'
					}
				}
			});
			expect(result).toBe(mockData);
		});
	});

	describe('create', () => {
		it('should create a department with default true status if not provided', async () => {
			const input = { name: 'New Dept' };
			const mockResult = { id: 1, name: 'New Dept', status: true };
			vi.mocked(db.department.create).mockResolvedValue(mockResult as never);

			const result = await departmentDao.create(input);

			expect(db.department.create).toHaveBeenCalledWith({
				data: {
					name: 'New Dept',
					status: true
				}
			});
			expect(result).toBe(mockResult);
		});

		it('should create a department with provided status', async () => {
			const input = { name: 'Old Dept', status: false };
			vi.mocked(db.department.create).mockResolvedValue({ ...input, id: 2 } as never);

			await departmentDao.create(input);

			expect(db.department.create).toHaveBeenCalledWith({
				data: {
					name: 'Old Dept',
					status: false
				}
			});
		});
	});

	describe('update', () => {
		it('should update department with provided data', async () => {
			const data = { name: 'Updated Dept', status: false };
			const mockResult = { id: 1, cuid: 'abc', ...data };
			vi.mocked(db.department.update).mockResolvedValue(mockResult as never);

			const result = await departmentDao.update('abc', data);

			expect(db.department.update).toHaveBeenCalledWith({
				where: { cuid: 'abc' },
				data
			});
			expect(result).toBe(mockResult);
		});

		it('should only update fields provided in data', async () => {
			const data = { status: false };
			vi.mocked(db.department.update).mockResolvedValue({ id: 1n, status: false } as never);

			await departmentDao.update('xyz', data);

			expect(db.department.update).toHaveBeenCalledWith({
				where: { cuid: 'xyz' },
				data: { status: false, updated_by: undefined }
			});
		});
	});
});
