 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as systemRoleDao from '$lib/server/dao/system-role.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			systemRoles: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn()
			}
		}
	};
});

describe('System Role DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it('should call db.systemRoles.findMany with order by system_role_name', async () => {
			const mockData = [{ id: 1, system_role_name: 'Admin' }];
			vi.mocked(db.systemRoles.findMany).mockResolvedValue(mockData as any);

			const result = await systemRoleDao.list();

			expect(db.systemRoles.findMany).toHaveBeenCalledWith({
				orderBy: { system_role_name: 'asc' }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('findById', () => {
		it('should call db.systemRoles.findUnique with correct id', async () => {
			const mockData = { id: 1, system_role_name: 'Admin' };
			vi.mocked(db.systemRoles.findUnique).mockResolvedValue(mockData as any);

			const result = await systemRoleDao.findById(1);

			expect(db.systemRoles.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('findByCuid2', () => {
		it('should call db.systemRoles.findUnique with correct cuid', async () => {
			const mockData = { id: 1, cuid: 'abc' };
			vi.mocked(db.systemRoles.findUnique).mockResolvedValue(mockData as any);

			const result = await systemRoleDao.findByCuid2('abc');

			expect(db.systemRoles.findUnique).toHaveBeenCalledWith({
				where: { cuid: 'abc' }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('create', () => {
		it('should create a system role with default true status', async () => {
			const input = { system_role_name: 'Editor' };
			const mockResult = { id: 1, system_role_name: 'Editor', status: true };
			vi.mocked(db.systemRoles.create).mockResolvedValue(mockResult as any);

			const result = await systemRoleDao.create(input);

			expect(db.systemRoles.create).toHaveBeenCalledWith({
				data: {
					system_role_name: 'Editor',
					status: true
				}
			});
			expect(result).toBe(mockResult);
		});

		it('should create a system role with provided status', async () => {
			const input = { system_role_name: 'Editor', status: false };
			vi.mocked(db.systemRoles.create).mockResolvedValue({ ...input, id: 1 } as any);

			await systemRoleDao.create(input);

			expect(db.systemRoles.create).toHaveBeenCalledWith({
				data: {
					system_role_name: 'Editor',
					status: false
				}
			});
		});
	});

	describe('update', () => {
		it('should update system role with provided data by id', async () => {
			const data = { system_role_name: 'Super Admin', status: false };
			const mockResult = { id: 1, ...data };
			vi.mocked(db.systemRoles.update).mockResolvedValue(mockResult as any);

			const result = await systemRoleDao.update(1, data);

			expect(db.systemRoles.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data
			});
			expect(result).toBe(mockResult);
		});
	});
});
