import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as permissionService from './permission.service.js';
import * as permissionDao from '$lib/server/dao/permission.dao.js';

vi.mock('$lib/server/dao/permission.dao.js', () => ({
	list: vi.fn(),
	findById: vi.fn(),
	findByCuid2: vi.fn(),
	create: vi.fn(),
	update: vi.fn()
}));

describe('Permission Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getPermissions', () => {
		it('should return mapped public permissions', async () => {
			const mockData = [
				{ id: 1, cuid2: 'abc', permission_key: 'admin_read', status: true },
				{ id: 2, cuid2: 'xyz', permission_key: 'admin_write', status: false }
			];
			vi.mocked(permissionDao.list).mockResolvedValue(mockData as any);

			const result = await permissionService.getPermissions();

			expect(permissionDao.list).toHaveBeenCalledTimes(1);
			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{ cuid2: 'abc', permission_key: 'admin_read', status: true },
				{ cuid2: 'xyz', permission_key: 'admin_write', status: false }
			]);
		});
	});

	describe('getPermissionById', () => {
		it('should throw if id is not a positive integer', async () => {
			await expect(permissionService.getPermissionById(0)).rejects.toThrow('Permission ID must be a positive integer');
			await expect(permissionService.getPermissionById(1.5)).rejects.toThrow('Permission ID must be a positive integer');
			await expect(permissionService.getPermissionById(-5)).rejects.toThrow('Permission ID must be a positive integer');
		});

		it('should throw if permission not found', async () => {
			vi.mocked(permissionDao.findById).mockResolvedValue(null);
			await expect(permissionService.getPermissionById(999)).rejects.toThrow('Permission with ID "999" not found');
		});

		it('should return mapped permission if found', async () => {
			const mockData = { id: 1, cuid2: 'abc', permission_key: 'admin_read', status: true };
			vi.mocked(permissionDao.findById).mockResolvedValue(mockData as any);

			const result = await permissionService.getPermissionById(1);
			expect(result).toEqual({ cuid2: 'abc', permission_key: 'admin_read', status: true });
		});
	});

	describe('getPermissionByCuid2', () => {
		it('should throw an error if cuid2 is missing', async () => {
			await expect(permissionService.getPermissionByCuid2('')).rejects.toThrow('Permission CUID2 is required');
			expect(permissionDao.findByCuid2).not.toHaveBeenCalled();
		});

		it('should throw an error if permission is not found', async () => {
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue(null);
			await expect(permissionService.getPermissionByCuid2('missing')).rejects.toThrow('Permission with CUID2 "missing" not found');
		});

		it('should return the mapped permission if found', async () => {
			const mockData = { id: 1, cuid2: 'abc', permission_key: 'admin_read', status: true };
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue(mockData as any);

			const result = await permissionService.getPermissionByCuid2('abc');
			expect(permissionDao.findByCuid2).toHaveBeenCalledWith('abc');
			expect(result).toEqual({ cuid2: 'abc', permission_key: 'admin_read', status: true });
		});
	});

	describe('createPermission', () => {
		describe('validation', () => {
			it('should throw if permission_key is invalid', async () => {
				await expect(permissionService.createPermission({ permission_key: '  ' })).rejects.toThrow('Permission key is required');
				await expect(permissionService.createPermission({ permission_key: 'ab' })).rejects.toThrow('Permission key must be at least 3 characters long');
				await expect(permissionService.createPermission({ permission_key: 'A'.repeat(101) })).rejects.toThrow('Permission key cannot exceed 100 characters');
				await expect(permissionService.createPermission({ permission_key: 'Admin Read' })).rejects.toThrow('Permission key must use lowercase snake_case');
				await expect(permissionService.createPermission({ permission_key: '1admin' })).rejects.toThrow('Permission key must use lowercase snake_case');
			});

			it('should throw if status is not boolean', async () => {
				await expect(permissionService.createPermission({ permission_key: 'admin_read', status: 'active' as any })).rejects.toThrow('Status must be a boolean');
			});
		});

		it('should throw an error if permission key already exists', async () => {
			vi.mocked(permissionDao.list).mockResolvedValue([{ id: 1, permission_key: 'admin_read' } as any]);
			await expect(permissionService.createPermission({ permission_key: 'admin_read' })).rejects.toThrow('Permission already exists');
		});

		it('should create and return the new permission', async () => {
			vi.mocked(permissionDao.list).mockResolvedValue([]);
			const mockCreated = { id: 2, cuid2: 'new123', permission_key: 'user_read', status: true };
			vi.mocked(permissionDao.create).mockResolvedValue(mockCreated as any);

			const result = await permissionService.createPermission({ permission_key: 'user_read', status: true });

			expect(permissionDao.create).toHaveBeenCalledWith({ permission_key: 'user_read', status: true });
			expect(result).toEqual({ cuid2: 'new123', permission_key: 'user_read', status: true });
		});
	});

	describe('updatePermission', () => {
		it('should throw error if permission not found', async () => {
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue(null);
			await expect(permissionService.updatePermission('abc', {})).rejects.toThrow('Permission with CUID2 "abc" not found');
		});

		it('should throw error if new permission key already exists on another record', async () => {
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue({ id: 1, cuid2: 'abc', permission_key: 'old_key' } as any);
			vi.mocked(permissionDao.list).mockResolvedValue([{ id: 2, cuid2: 'xyz', permission_key: 'new_key' } as any]);

			await expect(permissionService.updatePermission('abc', { permission_key: 'new_key' })).rejects.toThrow('Permission already exists');
		});

		it('should allow updating with same name', async () => {
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue({ id: 1, cuid2: 'abc', permission_key: 'same_key' } as any);
			vi.mocked(permissionDao.list).mockResolvedValue([{ id: 1, cuid2: 'abc', permission_key: 'same_key' } as any]);
			vi.mocked(permissionDao.update).mockResolvedValue({ id: 1, cuid2: 'abc', permission_key: 'same_key', status: true } as any);

			await permissionService.updatePermission('abc', { permission_key: 'same_key' });
			expect(permissionDao.update).toHaveBeenCalledWith(1, { permission_key: 'same_key' });
		});

		it('should update permission fields correctly', async () => {
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue({ id: 1, cuid2: 'abc', permission_key: 'old_key' } as any);
			vi.mocked(permissionDao.list).mockResolvedValue([]);
			vi.mocked(permissionDao.update).mockResolvedValue({ id: 1, cuid2: 'abc', permission_key: 'new_key', status: false } as any);

			const result = await permissionService.updatePermission('abc', { permission_key: 'new_key', status: false });

			expect(permissionDao.update).toHaveBeenCalledWith(1, { permission_key: 'new_key', status: false });
			expect(result).toEqual({ cuid2: 'abc', permission_key: 'new_key', status: false });
		});
	});

	describe('deletePermission', () => {
		it('should throw error if permission not found', async () => {
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue(null);
			await expect(permissionService.deletePermission('abc')).rejects.toThrow('Permission with CUID2 "abc" not found');
		});

		it('should perform a soft delete by setting status to false', async () => {
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue({ id: 1, cuid2: 'abc', permission_key: 'admin_read' } as any);
			vi.mocked(permissionDao.update).mockResolvedValue({ id: 1, cuid2: 'abc', permission_key: 'admin_read', status: false } as any);

			const result = await permissionService.deletePermission('abc');

			expect(permissionDao.update).toHaveBeenCalledWith(1, { status: false });
			expect(result).toEqual({ cuid2: 'abc', permission_key: 'admin_read', status: false });
		});
	});
});
