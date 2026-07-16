 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as systemRoleService from '$lib/server/services/system-role.service.js';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';

vi.mock('$lib/server/dao/system-role.dao.js', () => ({
	list: vi.fn(),
	findById: vi.fn(),
	findByCuid2: vi.fn(),
	create: vi.fn(),
	update: vi.fn() 
}));

vi.mock('$lib/server/services/keycloak/keycloak-role-sync.service.js', () => ({
	KeycloakRoleSyncService: {
		syncRoleCreated: vi.fn(),
		syncRoleUpdated: vi.fn(),
		syncRoleDeleted: vi.fn()
	}
}));

describe('System Role Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getSystemRoles', () => {
		it('should return mapped public system roles', async () => {
			const mockData = [
				{ id: 1n, cuid: 'abc', name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ id: 2n, cuid: 'xyz', name: 'Editor', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			];
			vi.mocked(systemRoleDao.list).mockResolvedValue(mockData as any);

			const result = await systemRoleService.getSystemRoles();

			expect(systemRoleDao.list).toHaveBeenCalledTimes(1);
			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{ cuid: 'abc', name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ cuid: 'xyz', name: 'Editor', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			]);
		});
	});

	describe('getSystemRoleById', () => {
		it('should throw if id is not a positive integer', async () => {
			await expect(systemRoleService.getSystemRoleById(0n)).rejects.toThrow('System role ID must be a positive integer');
			await expect(systemRoleService.getSystemRoleById(1.5 as unknown as bigint)).rejects.toThrow('System role ID must be a positive integer');
			await expect(systemRoleService.getSystemRoleById(-5n)).rejects.toThrow('System role ID must be a positive integer');
		});

		it('should throw if system role not found', async () => {
			vi.mocked(systemRoleDao.findById).mockResolvedValue(null);
			await expect(systemRoleService.getSystemRoleById(999n)).rejects.toThrow('System role with ID "999" not found');
		});

		it('should return mapped system role if found', async () => {
			const mockData = { id: 1n, cuid: 'abc', name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(systemRoleDao.findById).mockResolvedValue(mockData as any);

			const result = await systemRoleService.getSystemRoleById(1n);
			expect(result).toEqual({ cuid: 'abc', name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('getSystemRoleByCuid2', () => {
		it('should throw an error if cuid is missing', async () => {
			await expect(systemRoleService.getSystemRoleByCuid2('')).rejects.toThrow('System role CUID2 is required');
			expect(systemRoleDao.findByCuid2).not.toHaveBeenCalled();
		});

		it('should throw an error if system role is not found', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue(null);
			await expect(systemRoleService.getSystemRoleByCuid2('missing')).rejects.toThrow('System role with CUID2 "missing" not found');
		});

		it('should return the mapped system role if found', async () => {
			const mockData = { id: 1n, cuid: 'abc', name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue(mockData as any);

			const result = await systemRoleService.getSystemRoleByCuid2('abc');
			expect(systemRoleDao.findByCuid2).toHaveBeenCalledWith('abc');
			expect(result).toEqual({ cuid: 'abc', name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('createSystemRole', () => {
		describe('validation', () => {
			it('should throw if name is invalid', async () => {
				await expect(systemRoleService.createSystemRole({ name: '  ' })).rejects.toThrow('Role name is required');
				await expect(systemRoleService.createSystemRole({ name: 'A' })).rejects.toThrow('Role name must be at least 2 characters long');
				await expect(systemRoleService.createSystemRole({ name: 'A'.repeat(101) })).rejects.toThrow('Role name cannot exceed 100 characters');
				await expect(systemRoleService.createSystemRole({ name: 'Admin123' })).rejects.toThrow('Role name must contain only letters and spaces');
			});

			it('should throw if status is not boolean', async () => {
				await expect(systemRoleService.createSystemRole({ name: 'Admin', status: 'active' as any })).rejects.toThrow('Status must be a boolean');
			});
		});

		it('should throw an error if system role already exists', async () => {
			vi.mocked(systemRoleDao.list).mockResolvedValue([{ id: 1n, name: 'Admin' } as any]);
			await expect(systemRoleService.createSystemRole({ name: 'Admin' })).rejects.toThrow('System role already exists');
		});

		it('should create and return the new system role', async () => {
			vi.mocked(systemRoleDao.list).mockResolvedValue([]);
			const mockCreated = { id: 2n, cuid: 'new123', name: 'Editor', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null };
			vi.mocked(systemRoleDao.create).mockResolvedValue(mockCreated as any);

			const result = await systemRoleService.createSystemRole({ name: 'Editor', status: true });

			expect(systemRoleDao.create).toHaveBeenCalledWith({ name: 'Editor', status: true });
			expect(result).toEqual({ cuid: 'new123', name: 'Editor', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('updateSystemRole', () => {
		it('should throw error if system role not found', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue(null);
			await expect(systemRoleService.updateSystemRole('abc', {})).rejects.toThrow('System role with CUID2 "abc" not found');
		});

		it('should throw error if new system role already exists on another record', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1n, cuid: 'abc', name: 'Old Role' } as any);
			vi.mocked(systemRoleDao.list).mockResolvedValue([{ id: 2n, cuid: 'xyz', name: 'New Role' } as any]);

			await expect(systemRoleService.updateSystemRole('abc', { name: 'New Role' })).rejects.toThrow('System role already exists');
		});

		it('should allow updating with same name', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1n, cuid: 'abc', name: 'Same Role' } as any);
			vi.mocked(systemRoleDao.list).mockResolvedValue([{ id: 1n, cuid: 'abc', name: 'Same Role' } as any]);
			vi.mocked(systemRoleDao.update).mockResolvedValue({ id: 1n, cuid: 'abc', name: 'Same Role', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			await systemRoleService.updateSystemRole('abc', { name: 'Same Role' });
			expect(systemRoleDao.update).toHaveBeenCalledWith(1n, { name: 'Same Role' });
		});

		it('should update system role fields correctly', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1n, cuid: 'abc', name: 'Old Role' } as any);
			vi.mocked(systemRoleDao.list).mockResolvedValue([]);
			vi.mocked(systemRoleDao.update).mockResolvedValue({ id: 1n, cuid: 'abc', name: 'New Role', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await systemRoleService.updateSystemRole('abc', { name: 'New Role', status: false });

			expect(systemRoleDao.update).toHaveBeenCalledWith(1n, { name: 'New Role', status: false });
			expect(result).toEqual({ cuid: 'abc', name: 'New Role', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('deleteSystemRole', () => {
		it('should throw error if system role not found', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue(null);
			await expect(systemRoleService.deleteSystemRole('abc')).rejects.toThrow('System role with CUID2 "abc" not found');
		});

		it('should perform a soft delete by setting status to false', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1n, cuid: 'abc', name: 'Admin' } as any);
			vi.mocked(systemRoleDao.update).mockResolvedValue({ id: 1n, cuid: 'abc', name: 'Admin', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await systemRoleService.deleteSystemRole('abc');

			expect(systemRoleDao.update).toHaveBeenCalledWith(1n, { status: false, updated_by: undefined });
			expect(result).toEqual({ cuid: 'abc', name: 'Admin', status: false, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});
});
