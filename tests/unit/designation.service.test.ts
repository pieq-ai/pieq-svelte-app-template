/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as designationService from '$lib/server/services/designation.service.js';
import * as designationDao from '$lib/server/dao/designation.dao.js';

vi.mock('$lib/server/dao/designation.dao.js', () => ({
	list: vi.fn(),
	findById: vi.fn(),
	findByCuid2: vi.fn(),
	create: vi.fn(),
	update: vi.fn()
}));

describe('Designation Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getDesignations', () => {
		it('should return mapped public designations', async () => {
			const mockData = [
				{ id: 1, cuid: 'abc', designation_name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ id: 2, cuid: 'xyz', designation_name: 'Director', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			];
			vi.mocked(designationDao.list).mockResolvedValue(mockData as any);

			const result = await designationService.getDesignations();

			expect(designationDao.list).toHaveBeenCalledTimes(1);
			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{ cuid: 'abc', designation_name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ cuid: 'xyz', designation_name: 'Director', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			]);
		});
	});

	describe('getDesignationById', () => {
		it('should throw if id is not a positive integer', async () => {
			await expect(designationService.getDesignationById(0)).rejects.toThrow('Designation ID must be a positive integer');
			await expect(designationService.getDesignationById(1.5)).rejects.toThrow('Designation ID must be a positive integer');
			await expect(designationService.getDesignationById(-5)).rejects.toThrow('Designation ID must be a positive integer');
		});

		it('should throw if designation not found', async () => {
			vi.mocked(designationDao.findById).mockResolvedValue(null);
			await expect(designationService.getDesignationById(999)).rejects.toThrow('Designation with ID "999" not found');
		});

		it('should return mapped designation if found', async () => {
			const mockData = { id: 1, cuid: 'abc', designation_name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(designationDao.findById).mockResolvedValue(mockData as any);

			const result = await designationService.getDesignationById(1);
			expect(result).toEqual({ cuid: 'abc', designation_name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('getDesignationByCuid2', () => {
		it('should throw an error if cuid is missing', async () => {
			await expect(designationService.getDesignationByCuid2('')).rejects.toThrow('Designation CUID2 is required');
			expect(designationDao.findByCuid2).not.toHaveBeenCalled();
		});

		it('should throw an error if designation is not found', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(null);
			await expect(designationService.getDesignationByCuid2('missing')).rejects.toThrow('Designation with CUID2 "missing" not found');
		});

		it('should return the mapped designation if found', async () => {
			const mockData = { id: 1, cuid: 'abc', designation_name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(mockData as any);

			const result = await designationService.getDesignationByCuid2('abc');
			expect(designationDao.findByCuid2).toHaveBeenCalledWith('abc');
			expect(result).toEqual({ cuid: 'abc', designation_name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('createDesignation', () => {
		it('should throw validation error for invalid name', async () => {
			await expect(designationService.createDesignation({ designation_name: '   ' })).rejects.toThrow('Designation name is required');
			await expect(designationService.createDesignation({ designation_name: 'Manager@123' })).rejects.toThrow('Designation can contain only letters, numbers, and spaces. Special characters are not allowed.');
			await expect(designationService.createDesignation({ designation_name: null as any })).rejects.toThrow('Designation name is required');
		});

		it('should throw an error if designation name already exists', async () => {
			vi.mocked(designationDao.list).mockResolvedValue([{ cuid: '123', designation_name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any]);
			await expect(designationService.createDesignation({ designation_name: 'manager ' })).rejects.toThrow('Designation already exists');
		});

		it('should create and return the new designation', async () => {
			vi.mocked(designationDao.list).mockResolvedValue([]);
			const mockCreated = { id: 2, cuid: 'new123', designation_name: 'Engineer', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(designationDao.create).mockResolvedValue(mockCreated as any);

			const result = await designationService.createDesignation({ designation_name: 'Engineer', status: true });

			expect(designationDao.create).toHaveBeenCalledWith({ designation_name: 'Engineer', status: true });
			expect(result).toEqual({ cuid: 'new123', designation_name: 'Engineer', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});

		it('should default status to true if not provided', async () => {
			vi.mocked(designationDao.list).mockResolvedValue([]);
			vi.mocked(designationDao.create).mockResolvedValue({ id: 2, cuid: 'new123', designation_name: 'Engineer', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await designationService.createDesignation({ designation_name: 'Engineer' });

			expect(designationDao.create).toHaveBeenCalledWith({ designation_name: 'Engineer', status: true });
		});
	});

	describe('updateDesignation', () => {
		it('should throw error if cuid is missing', async () => {
			await expect(designationService.updateDesignation('', {})).rejects.toThrow('Designation CUID2 is required');
		});

		it('should throw error if designation not found', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(null);
			await expect(designationService.updateDesignation('abc', {})).rejects.toThrow('Designation with CUID2 "abc" not found');
		});

		it('should throw error if new designation name already exists', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'OldName' } as any);
			vi.mocked(designationDao.list).mockResolvedValue([{ id: 2, cuid: 'xyz', designation_name: 'NewName' } as any]);

			await expect(designationService.updateDesignation('abc', { designation_name: 'NewName' })).rejects.toThrow('Designation already exists');
		});

		it('should bypass uniqueness check if name is the same as existing (case insensitive)', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 1, designation_name: 'SameName', cuid: 'abc' } as any);
			vi.mocked(designationDao.list).mockResolvedValue([{ id: 1, designation_name: 'SameName', cuid: 'abc' } as any]);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 1, designation_name: 'Samename', cuid: 'abc', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await designationService.updateDesignation('abc', { designation_name: 'Samename' });

			expect(designationDao.update).toHaveBeenCalledWith('abc', { designation_name: 'Samename' });
		});

		it('should throw error if status is not a boolean', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'Manager' } as any);
			await expect(designationService.updateDesignation('abc', { status: 'active' as any })).rejects.toThrow('Status must be a boolean');
		});

		it('should update designation fields correctly', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'Manager' } as any);
			vi.mocked(designationDao.list).mockResolvedValue([]);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'Senior Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await designationService.updateDesignation('abc', { designation_name: 'Senior Manager', status: false });

			expect(designationDao.update).toHaveBeenCalledWith('abc', { designation_name: 'Senior Manager', status: false });
			expect(result).toEqual({ cuid: 'abc', designation_name: 'Senior Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});

		it('should update only provided fields', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'Manager' } as any);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await designationService.updateDesignation('abc', { status: false });

			expect(designationDao.update).toHaveBeenCalledWith('abc', { status: false });
		});
	});

	describe('deleteDesignation', () => {
		it('should throw error if cuid is missing', async () => {
			await expect(designationService.deleteDesignation('')).rejects.toThrow('Designation CUID2 is required');
		});

		it('should throw error if designation not found', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(null);
			await expect(designationService.deleteDesignation('abc')).rejects.toThrow('Designation with CUID2 "abc" not found');
		});

		it('should perform a soft delete by setting status to false', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'Manager' } as any);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 1, cuid: 'abc', designation_name: 'Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await designationService.deleteDesignation('abc');

			expect(designationDao.update).toHaveBeenCalledWith('abc', { status: false });
			expect(result).toEqual({ cuid: 'abc', designation_name: 'Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});
});
