/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as designationService from '$lib/server/services/designation.service.js';
import * as designationDao from '$lib/server/dao/designation.dao.js';

vi.mock('$lib/server/dao/designation.dao.js', () => ({
	list: vi.fn(),
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
				{ id: 'abc', cuid: 'abc', name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ id: 2n, cuid: 'xyz', name: 'Director', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			];
			vi.mocked(designationDao.list).mockResolvedValue(mockData as any);

			const result = await designationService.getDesignations();

			expect(designationDao.list).toHaveBeenCalledTimes(1);
			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{ cuid: 'abc', name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ cuid: 'xyz', name: 'Director', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			]);
		});
	});

	describe('getDesignationByCuid', () => {
		it('should throw an error if designation is not found', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(null);
			await expect(designationService.getDesignationByCuid('missing')).rejects.toThrow('Designation not found');
		});

		it('should return the mapped designation if found', async () => {
			const mockData = { id: 'abc', cuid: 'abc', name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(mockData as any);

			const result = await designationService.getDesignationByCuid('abc');
			expect(designationDao.findByCuid2).toHaveBeenCalledWith('abc');
			expect(result).toEqual({ cuid: 'abc', name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('createDesignation', () => {
		it('should throw validation error for invalid name', async () => {
			await expect(designationService.createDesignation({ name: '   ' })).rejects.toThrow('Designation name cannot be empty or just whitespace');
			await expect(designationService.createDesignation({ name: 'M' })).rejects.toThrow('Designation name must be at least 2 characters long');
		});

		it('should throw an error if designation name already exists', async () => {
			vi.mocked(designationDao.list).mockResolvedValue([{ cuid: '123', name: 'Manager', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any]);
			await expect(designationService.createDesignation({ name: 'manager ' })).rejects.toThrow('Designation already exists');
		});

		it('should create and return the new designation', async () => {
			vi.mocked(designationDao.list).mockResolvedValue([]);
			const mockCreated = { id: 2n, cuid: 'new123', name: 'Engineer', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(designationDao.create).mockResolvedValue(mockCreated as any);

			const result = await designationService.createDesignation({ name: 'Engineer', status: true });

			expect(designationDao.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Engineer', status: true }));
			expect(result).toEqual({ cuid: 'new123', name: 'Engineer', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});

		it('should default status to true if not provided', async () => {
			vi.mocked(designationDao.list).mockResolvedValue([]);
			vi.mocked(designationDao.create).mockResolvedValue({ id: 2n, cuid: 'new123', name: 'Engineer', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await designationService.createDesignation({ name: 'Engineer' });

			expect(designationDao.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Engineer', status: true }));
		});
	});

	describe('updateDesignation', () => {
		it('should throw error if designation not found', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(null);
			await expect(designationService.updateDesignation('abc', {})).rejects.toThrow('Designation not found');
		});

		it('should throw error if new designation name already exists', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 'abc', cuid: 'abc', name: 'OldName' } as any);
			vi.mocked(designationDao.list).mockResolvedValue([{ id: 2n, cuid: 'xyz', name: 'NewName' } as any]);

			await expect(designationService.updateDesignation('abc', { name: 'NewName' })).rejects.toThrow('Designation already exists');
		});

		it('should bypass uniqueness check if name is the same as existing (case insensitive)', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 'abc', name: 'SameName', cuid: 'abc' } as any);
			vi.mocked(designationDao.list).mockResolvedValue([{ id: 'abc', name: 'SameName', cuid: 'abc' } as any]);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 'abc', name: 'Samename', cuid: 'abc', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await designationService.updateDesignation('abc', { name: 'Samename' });

			expect(designationDao.update).toHaveBeenCalledWith('abc', expect.objectContaining({ name: 'Samename' }));
		});

		it('should update designation fields correctly', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 'abc', cuid: 'abc', name: 'Manager' } as any);
			vi.mocked(designationDao.list).mockResolvedValue([]);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 'abc', cuid: 'abc', name: 'Senior Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await designationService.updateDesignation('abc', { name: 'Senior Manager', status: false });

			expect(designationDao.update).toHaveBeenCalledWith('abc', expect.objectContaining({ name: 'Senior Manager', status: false }));
			expect(result).toEqual({ cuid: 'abc', name: 'Senior Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});

		it('should update only provided fields', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 'abc', cuid: 'abc', name: 'Manager' } as any);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 'abc', cuid: 'abc', name: 'Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await designationService.updateDesignation('abc', { status: false });

			expect(designationDao.update).toHaveBeenCalledWith('abc', expect.objectContaining({ status: false }));
		});
	});

	describe('deleteDesignation', () => {
		it('should throw error if designation not found', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue(null);
			await expect(designationService.deleteDesignation('abc')).rejects.toThrow('Designation not found');
		});

		it('should perform a soft delete by setting status to false', async () => {
			vi.mocked(designationDao.findByCuid2).mockResolvedValue({ id: 'abc', cuid: 'abc', name: 'Manager' } as any);
			vi.mocked(designationDao.update).mockResolvedValue({ id: 'abc', cuid: 'abc', name: 'Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await designationService.deleteDesignation('abc');

			expect(designationDao.update).toHaveBeenCalledWith('abc', expect.objectContaining({ status: false }));
			expect(result).toEqual({ id: 'abc', cuid: 'abc', name: 'Manager', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});
});
