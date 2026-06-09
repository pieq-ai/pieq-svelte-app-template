 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as rolePermissionService from '$lib/server/services/role-permission.service.js';
import * as permissionDao from '$lib/server/dao/permission.dao.js';
import * as rolePermissionDao from '$lib/server/dao/role-permission.dao.js';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';

vi.mock('$lib/server/dao/permission.dao.js', () => ({
	list: vi.fn(),
	findByCuid2: vi.fn()
}));

vi.mock('$lib/server/dao/role-permission.dao.js', () => ({
	list: vi.fn(),
	findByRoleAndPermission: vi.fn(),
	create: vi.fn(),
	removeByRoleAndPermission: vi.fn()
}));

vi.mock('$lib/server/dao/system-role.dao.js', () => ({
	list: vi.fn(),
	findByCuid2: vi.fn()
}));

describe('Role Permission Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getRolePermissionMatrix', () => {
		it('should retrieve and format matrix data correctly', async () => {
			vi.mocked(systemRoleDao.list).mockResolvedValue([
				{ id: 1, cuid: 'role1', system_role_name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			] as any);
			
			vi.mocked(permissionDao.list).mockResolvedValue([
				{ id: 1, cuid: 'perm1', permission_key: 'user_read', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ id: 2, cuid: 'perm2', permission_key: 'user_write', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ id: 3, cuid: 'perm3', permission_key: 'general_view', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			] as any);

			vi.mocked(rolePermissionDao.list).mockResolvedValue([
				{ id: 1, cuid: 'rp1', system_role_cuid: 'role1', permission_cuid: 'perm1' }
			] as any);

			const result = await rolePermissionService.getRolePermissionMatrix();

			expect(result.roles).toHaveLength(1);
			expect(result.roles[0]).toEqual({ cuid: 'role1', system_role_name: 'Admin', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });

			expect(result.permissions).toHaveLength(3);
			expect(result.groupedPermissions).toEqual({
				user: [
					{ cuid: 'perm1', permission_key: 'user_read', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
					{ cuid: 'perm2', permission_key: 'user_write', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
				],
				general: [
					{ cuid: 'perm3', permission_key: 'general_view', status: true, created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
				]
			});

			expect(result.mappings).toHaveLength(1);
			expect(result.mappings[0]).toEqual({
				cuid: 'rp1',
				system_role_cuid: 'role1',
				permission_cuid: 'perm1'
			});
		});
	});

	describe('assignPermissionsToRole', () => {
		it('should throw if role cuid is missing', async () => {
			await expect(rolePermissionService.assignPermissionsToRole({ system_role_cuid: '', permission_cuids: ['perm1'] })).rejects.toThrow('System role CUID2 is required');
		});

		it('should throw if permissions array is empty or invalid', async () => {
			await expect(rolePermissionService.assignPermissionsToRole({ system_role_cuid: 'role1', permission_cuids: [] })).rejects.toThrow('At least one permission is required');
			await expect(rolePermissionService.assignPermissionsToRole({ system_role_cuid: 'role1', permission_cuids: null as any })).rejects.toThrow('At least one permission is required');
		});

		it('should throw if system role not found', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue(null);
			await expect(rolePermissionService.assignPermissionsToRole({ system_role_cuid: 'role1', permission_cuids: ['perm1'] })).rejects.toThrow('System role not found');
		});

		it('should throw if permission CUID2 is invalid or not found', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'role1' } as any);
			
			await expect(rolePermissionService.assignPermissionsToRole({ system_role_cuid: 'role1', permission_cuids: [''] })).rejects.toThrow('Permission CUID2 is required');

			vi.mocked(permissionDao.findByCuid2).mockResolvedValue(null);
			await expect(rolePermissionService.assignPermissionsToRole({ system_role_cuid: 'role1', permission_cuids: ['invalid_perm'] })).rejects.toThrow('Permission with CUID2 "invalid_perm" not found');
		});

		it('should create new mappings and skip existing ones', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'role1' } as any);
			
			vi.mocked(permissionDao.findByCuid2).mockImplementation(async (cuid) => {
				return { id: cuid === 'perm1' ? 1 : 2, cuid: cuid } as any;
			});

			vi.mocked(rolePermissionDao.findByRoleAndPermission).mockImplementation(async (roleId, permId) => {
				if (permId === 'perm1') return { id: 1, system_role_cuid: roleId, permission_cuid: permId } as any;
				return null;
			});

			vi.mocked(rolePermissionDao.create).mockImplementation(async (data) => ({ id: 2, ...data } as any));

			const result = await rolePermissionService.assignPermissionsToRole({
				system_role_cuid: 'role1',
				permission_cuids: ['perm1', 'perm2', 'perm2'] // perm2 duplicate in input
			});

			expect(result.skipped).toHaveLength(1); // perm1 skipped
			expect(result.created).toHaveLength(1); // perm2 created once
			expect(rolePermissionDao.create).toHaveBeenCalledTimes(1);
			expect(rolePermissionDao.create).toHaveBeenCalledWith({
				system_role_cuid: 'role1',
				permission_cuid: 'perm2'
			});
		});
	});

	describe('removePermissionFromRoleByCuid2', () => {
		it('should throw if ids are invalid', async () => {
			await expect(rolePermissionService.removePermissionFromRoleByCuid2('', 'perm1')).rejects.toThrow('System role CUID2 is required');
			await expect(rolePermissionService.removePermissionFromRoleByCuid2('role1', '')).rejects.toThrow('Permission CUID2 is required');
		});

		it('should throw if role or permission not found', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue(null);
			await expect(rolePermissionService.removePermissionFromRoleByCuid2('role1', 'perm1')).rejects.toThrow('System role not found');

			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'role1' } as any);
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue(null);
			await expect(rolePermissionService.removePermissionFromRoleByCuid2('role1', 'perm1')).rejects.toThrow('Permission not found');
		});

		it('should throw if mapping not found', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'role1' } as any);
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue({ id: 2, cuid: 'perm1' } as any);
			vi.mocked(rolePermissionDao.findByRoleAndPermission).mockResolvedValue(null);

			await expect(rolePermissionService.removePermissionFromRoleByCuid2('role1', 'perm1')).rejects.toThrow('Role permission mapping not found');
		});

		it('should remove mapping successfully', async () => {
			vi.mocked(systemRoleDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'role1' } as any);
			vi.mocked(permissionDao.findByCuid2).mockResolvedValue({ id: 2, cuid: 'perm1' } as any);
			vi.mocked(rolePermissionDao.findByRoleAndPermission).mockResolvedValue({ id: 3 } as any);
			
			vi.mocked(rolePermissionDao.removeByRoleAndPermission).mockResolvedValue({ id: 3 } as any);

			const result = await rolePermissionService.removePermissionFromRoleByCuid2('role1', 'perm1');

			expect(rolePermissionDao.removeByRoleAndPermission).toHaveBeenCalledWith('role1', 'perm1');
			expect(result).toEqual({ id: 3 });
		});
	});
});
