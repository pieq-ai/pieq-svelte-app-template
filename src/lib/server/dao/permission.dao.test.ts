/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as permissionDao from './permission.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	return {
		db: {
			permissions: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn()
			}
		}
	};
});

describe('Permission DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it('should call db.permissions.findMany with order by permission_key', async () => {
			const mockData = [{ id: 1, permission_key: 'admin.read' }];
			vi.mocked(db.permissions.findMany).mockResolvedValue(mockData as any);

			const result = await permissionDao.list();

			expect(db.permissions.findMany).toHaveBeenCalledWith({
				orderBy: { permission_key: 'asc' }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('findById', () => {
		it('should call db.permissions.findUnique with correct id', async () => {
			const mockData = { id: 1, permission_key: 'admin.read' };
			vi.mocked(db.permissions.findUnique).mockResolvedValue(mockData as any);

			const result = await permissionDao.findById(1);

			expect(db.permissions.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('findByCuid2', () => {
		it('should call db.permissions.findUnique with correct cuid', async () => {
			const mockData = { id: 1, cuid: 'abc' };
			vi.mocked(db.permissions.findUnique).mockResolvedValue(mockData as any);

			const result = await permissionDao.findByCuid2('abc');

			expect(db.permissions.findUnique).toHaveBeenCalledWith({
				where: { cuid: 'abc' }
			});
			expect(result).toBe(mockData);
		});
	});

	describe('create', () => {
		it('should create a permission with default true status', async () => {
			const input = { permission_key: 'admin.write' };
			const mockResult = { id: 1, permission_key: 'admin.write', status: true };
			vi.mocked(db.permissions.create).mockResolvedValue(mockResult as any);

			const result = await permissionDao.create(input);

			expect(db.permissions.create).toHaveBeenCalledWith({
				data: {
					permission_key: 'admin.write',
					status: true
				}
			});
			expect(result).toBe(mockResult);
		});

		it('should create a permission with provided status', async () => {
			const input = { permission_key: 'admin.write', status: false };
			vi.mocked(db.permissions.create).mockResolvedValue({ ...input, id: 1 } as any);

			await permissionDao.create(input);

			expect(db.permissions.create).toHaveBeenCalledWith({
				data: {
					permission_key: 'admin.write',
					status: false
				}
			});
		});
	});

	describe('update', () => {
		it('should update permission with provided data by id', async () => {
			const data = { permission_key: 'admin.delete', status: false };
			const mockResult = { id: 1, ...data };
			vi.mocked(db.permissions.update).mockResolvedValue(mockResult as any);

			const result = await permissionDao.update(1, data);

			expect(db.permissions.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data
			});
			expect(result).toBe(mockResult);
		});
	});
});
