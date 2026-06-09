/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as designationDao from '$lib/server/dao/designation.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			designation: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn()
			}
		}
	};
});

describe('Designation DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it('should call db.designation.findMany with order by designation_name', async () => {
			const mockData = [{ id: 1, designation_name: 'Manager' }];
			vi.mocked(db.designation.findMany).mockResolvedValue(mockData as any);

			const result = await designationDao.list();

			expect(db.designation.findMany).toHaveBeenCalledWith({
				orderBy: { designation_name: 'asc' }
			});
			expect(result).toBe(mockData);
		});

		it('should handle db errors', async () => {
			vi.mocked(db.designation.findMany).mockRejectedValue(new Error('DB connection failed'));
			await expect(designationDao.list()).rejects.toThrow('DB connection failed');
		});
	});

	describe('findById', () => {
		it('should call db.designation.findUnique with correct id', async () => {
			const mockData = { id: 1, designation_name: 'Manager' };
			vi.mocked(db.designation.findUnique).mockResolvedValue(mockData as any);

			const result = await designationDao.findById(1n);

			expect(db.designation.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(result).toBe(mockData);
		});

		it('should return null if not found', async () => {
			vi.mocked(db.designation.findUnique).mockResolvedValue(null);
			const result = await designationDao.findById(999n);
			expect(result).toBeNull();
		});
	});

	describe('findByCuid2', () => {
		it('should call db.designation.findUnique with correct cuid', async () => {
			const mockData = { id: 1, cuid: 'abc' };
			vi.mocked(db.designation.findUnique).mockResolvedValue(mockData as any);

			const result = await designationDao.findByCuid2('abc');

			expect(db.designation.findUnique).toHaveBeenCalledWith({
				where: { cuid: 'abc' }
			});
			expect(result).toBe(mockData);
		});

		it('should return null if not found', async () => {
			vi.mocked(db.designation.findUnique).mockResolvedValue(null);
			const result = await designationDao.findByCuid2('xyz');
			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should create a designation with default true status', async () => {
			const input = { designation_name: 'Engineer' };
			const mockResult = { id: 1, designation_name: 'Engineer', status: true };
			vi.mocked(db.designation.create).mockResolvedValue(mockResult as any);

			const result = await designationDao.create(input);

			expect(db.designation.create).toHaveBeenCalledWith({
				data: {
					designation_name: 'Engineer',
					status: true
				}
			});
			expect(result).toBe(mockResult);
		});

		it('should create a designation with provided status', async () => {
			const input = { designation_name: 'Engineer', status: false };
			vi.mocked(db.designation.create).mockResolvedValue({ ...input, id: 1 } as any);

			await designationDao.create(input);

			expect(db.designation.create).toHaveBeenCalledWith({
				data: {
					designation_name: 'Engineer',
					status: false
				}
			});
		});
	});

	describe('update', () => {
		it('should update designation with provided data', async () => {
			const data = { designation_name: 'Senior Engineer', status: false };
			const mockResult = { id: 1, cuid: 'abc', ...data };
			vi.mocked(db.designation.update).mockResolvedValue(mockResult as any);

			const result = await designationDao.update('abc', data);

			expect(db.designation.update).toHaveBeenCalledWith({
				where: { cuid: 'abc' },
				data
			});
			expect(result).toBe(mockResult);
		});

		it('should only update fields provided in data', async () => {
			const data = { status: false };
			vi.mocked(db.designation.update).mockResolvedValue({ id: 1, status: false } as any);

			await designationDao.update('xyz', data);

			expect(db.designation.update).toHaveBeenCalledWith({
				where: { cuid: 'xyz' },
				data: { status: false, updated_by: undefined }
			});
		});
	});
});
