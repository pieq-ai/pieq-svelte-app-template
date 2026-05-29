import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as rolePermissionDao from './role-permission.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			rolePermission: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				delete: vi.fn()
			}
		}
	};
});

describe('Role Permission DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it('should call db.rolePermission.findMany with order by id', async () => {
			const mockData = [{ id: 1, system_role_cuid2: 'role1', permission_cuid2: 'perm1' }];
			vi.mocked(db.rolePermission.findMany).mockResolvedValue(mockData as any);

			const result = await rolePermissionDao.list();

			expect(db.rolePermission.findMany).toHaveBeenCalledWith({
				orderBy: { id: 'asc' }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('findById', () => {
		it('should call db.rolePermission.findUnique with correct id', async () => {
			const mockData = { id: 1 };
			vi.mocked(db.rolePermission.findUnique).mockResolvedValue(mockData as any);

			const result = await rolePermissionDao.findById(1);

			expect(db.rolePermission.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('findByRoleAndPermission', () => {
		it('should call db.rolePermission.findUnique with correct compound key', async () => {
			const mockData = { id: 1, system_role_cuid2: 'role1', permission_cuid2: 'perm1' };
			vi.mocked(db.rolePermission.findUnique).mockResolvedValue(mockData as any);

			const result = await rolePermissionDao.findByRoleAndPermission('role1', 'perm1');

			expect(db.rolePermission.findUnique).toHaveBeenCalledWith({
				where: {
					system_role_cuid2_permission_cuid2: {
						system_role_cuid2: 'role1',
						permission_cuid2: 'perm1'
					}
				}
			});
			expect(result).toBe(mockData);
		});
	});

	describe('create', () => {
		it('should create a role permission', async () => {
			const input = { system_role_cuid2: 'role1', permission_cuid2: 'perm1' };
			const mockResult = { id: 1, ...input };
			vi.mocked(db.rolePermission.create).mockResolvedValue(mockResult as any);

			const result = await rolePermissionDao.create(input);

			expect(db.rolePermission.create).toHaveBeenCalledWith({
				data: input
			});
			expect(result).toBe(mockResult);
		});
	});

	describe('remove', () => {
		it('should delete a role permission by id', async () => {
			const mockResult = { id: 1 };
			vi.mocked(db.rolePermission.delete).mockResolvedValue(mockResult as any);

			const result = await rolePermissionDao.remove(1);

			expect(db.rolePermission.delete).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(result).toBe(mockResult);
		});
	});

	describe('removeByRoleAndPermission', () => {
		it('should delete a role permission by compound key', async () => {
			const mockResult = { id: 1 };
			vi.mocked(db.rolePermission.delete).mockResolvedValue(mockResult as any);

			const result = await rolePermissionDao.removeByRoleAndPermission('role1', 'perm1');

			expect(db.rolePermission.delete).toHaveBeenCalledWith({
				where: {
					system_role_cuid2_permission_cuid2: {
						system_role_cuid2: 'role1',
						permission_cuid2: 'perm1'
					}
				}
			});
			expect(result).toBe(mockResult);
		});
	});
});
