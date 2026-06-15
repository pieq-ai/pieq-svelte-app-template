 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as departmentService from '$lib/server/services/department.service.js';
import * as departmentDao from '$lib/server/dao/department.dao.js';
import * as validator from '$lib/server/validators/department.validator.js';

vi.mock('$lib/server/dao/department.dao.js', () => ({
	list: vi.fn(),
	findByCuid2: vi.fn(),
	findByName: vi.fn(),
	create: vi.fn(),
	update: vi.fn()
}));

vi.mock('$lib/server/validators/department.validator.js', () => ({
	validateDepartmentName: vi.fn((name) => name)
}));

describe('Department Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(validator.validateDepartmentName).mockImplementation((name) => String(name).trim());
	});

	describe('getDepartments', () => {
		it('should return mapped public departments', async () => {
			const mockData = [
				{ id: 1, cuid: 'abc', name: 'IT', status: true, created_at: new Date('2026-05-29T12:00:00Z'), updated_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_by: null },
				{ id: 2, cuid: 'xyz', name: 'HR', status: false, created_at: new Date('2026-05-29T12:00:00Z'), updated_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_by: null }
			];
			vi.mocked(departmentDao.list).mockResolvedValue(mockData as any);

			const result = await departmentService.getDepartments();

			expect(departmentDao.list).toHaveBeenCalledTimes(1);
			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{ cuid: 'abc', name: 'IT', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ cuid: 'xyz', name: 'HR', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			]);
		});
	});

	describe('getDepartmentByCuid2', () => {
		it('should throw an error if cuid is missing', async () => {
			await expect(departmentService.getDepartmentByCuid2('')).rejects.toThrow('Department CUID2 is required');
			expect(departmentDao.findByCuid2).not.toHaveBeenCalled();
		});

		it('should throw an error if department is not found', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue(null);
			await expect(departmentService.getDepartmentByCuid2('missing')).rejects.toThrow('Department with CUID2 "missing" not found');
		});

		it('should return the mapped department if found', async () => {
			const mockData = { id: 1, cuid: 'abc', name: 'IT', status: true, created_at: new Date('2026-05-29T12:00:00Z'), updated_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_by: null };
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue(mockData as any);

			const result = await departmentService.getDepartmentByCuid2('abc');
			expect(departmentDao.findByCuid2).toHaveBeenCalledWith('abc');
			expect(result).toEqual({ cuid: 'abc', name: 'IT', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('createDepartment', () => {
		it('should throw an error if department name already exists', async () => {
			vi.mocked(departmentDao.findByName).mockResolvedValue({ id: 1 } as any);
			await expect(departmentService.createDepartment({ name: 'IT' })).rejects.toThrow('Department name "IT" already exists');
			expect(validator.validateDepartmentName).toHaveBeenCalledWith('IT');
		});

		it('should create and return the new department', async () => {
			vi.mocked(departmentDao.findByName).mockResolvedValue(null);
			const mockCreated = { id: 2, cuid: 'new123', name: 'Sales', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(departmentDao.create).mockResolvedValue(mockCreated as any);

			const result = await departmentService.createDepartment({ name: 'Sales', status: true });

			expect(departmentDao.create).toHaveBeenCalledWith({ name: 'Sales', status: true });
			expect(result).toEqual({ cuid: 'new123', name: 'Sales', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});

		it('should default status to true if not provided', async () => {
			vi.mocked(departmentDao.findByName).mockResolvedValue(null);
			vi.mocked(departmentDao.create).mockResolvedValue({ id: 2, cuid: 'new123', name: 'Sales', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await departmentService.createDepartment({ name: 'Sales' });

			expect(departmentDao.create).toHaveBeenCalledWith({ name: 'Sales', status: true });
		});
	});

	describe('updateDepartment', () => {
		it('should throw error if cuid is missing', async () => {
			await expect(departmentService.updateDepartment('', {})).rejects.toThrow('Department CUID2 is required');
		});

		it('should throw error if department not found', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue(null);
			await expect(departmentService.updateDepartment('abc', {})).rejects.toThrow('Department with CUID2 "abc" not found');
		});

		it('should throw error if new department name already exists', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue({ id: 1, name: 'OldName' } as any);
			vi.mocked(departmentDao.findByName).mockResolvedValue({ id: 2, name: 'NewName' } as any);

			await expect(departmentService.updateDepartment('abc', { name: 'NewName' })).rejects.toThrow('Department name "NewName" already exists');
		});

		it('should bypass uniqueness check if name is the same as existing', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue({ id: 1, name: 'SameName', cuid: 'abc' } as any);
			vi.mocked(departmentDao.update).mockResolvedValue({ id: 1, name: 'SameName', cuid: 'abc', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await departmentService.updateDepartment('abc', { name: 'SameName' });

			expect(departmentDao.findByName).not.toHaveBeenCalled();
			expect(departmentDao.update).toHaveBeenCalledWith('abc', { name: 'SameName' });
		});

		it('should throw error if status is not a boolean', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue({ id: 1, name: 'IT' } as any);
			await expect(departmentService.updateDepartment('abc', { status: 'active' as any })).rejects.toThrow('Status must be a boolean');
		});

		it('should update department fields correctly', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue({ id: 1, name: 'IT' } as any);
			vi.mocked(departmentDao.findByName).mockResolvedValue(null);
			vi.mocked(departmentDao.update).mockResolvedValue({ id: 1, cuid: 'abc', name: 'IT 2', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await departmentService.updateDepartment('abc', { name: 'IT 2', status: false });

			expect(departmentDao.update).toHaveBeenCalledWith('abc', { name: 'IT 2', status: false });
			expect(result).toEqual({ cuid: 'abc', name: 'IT 2', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});

		it('should update only provided fields', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue({ id: 1, name: 'IT' } as any);
			vi.mocked(departmentDao.update).mockResolvedValue({ id: 1, cuid: 'abc', name: 'IT', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await departmentService.updateDepartment('abc', { status: false });

			expect(departmentDao.update).toHaveBeenCalledWith('abc', { status: false });
			expect(departmentDao.findByName).not.toHaveBeenCalled();
		});
	});

	describe('deleteDepartment', () => {
		it('should throw error if cuid is missing', async () => {
			await expect(departmentService.deleteDepartment('')).rejects.toThrow('Department CUID2 is required');
		});

		it('should throw error if department not found', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue(null);
			await expect(departmentService.deleteDepartment('abc')).rejects.toThrow('Department with CUID2 "abc" not found');
		});

		it('should perform a soft delete by setting status to false', async () => {
			vi.mocked(departmentDao.findByCuid2).mockResolvedValue({ id: 1, name: 'IT' } as any);
			vi.mocked(departmentDao.update).mockResolvedValue({ id: 1, cuid: 'abc', name: 'IT', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await departmentService.deleteDepartment('abc');

			expect(departmentDao.update).toHaveBeenCalledWith('abc', { status: false });
			expect(result).toEqual({ cuid: 'abc', name: 'IT', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});
});
