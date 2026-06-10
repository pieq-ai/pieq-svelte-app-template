import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dao from '$lib/server/dao/salary-structure.dao.js';
import { db } from '$lib/server/db.js';

vi.mock('$lib/server/db.js', () => ({
	db: {
		salaryStructure: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn()
		},
		salaryStructureItem: {
			findMany: vi.fn(),
			create: vi.fn(),
			deleteMany: vi.fn()
		}
	}
}));

describe('Salary Structure DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ─── create ────────────────────────────────────────────────────────────────

	describe('create', () => {
		it('should call db.salaryStructure.create with correct data', async () => {
			const mockResult = { id: 1n, cuid: 'struct_1', employee_cuid: 'EMP001' };
			vi.mocked(db.salaryStructure.create).mockResolvedValue(mockResult as never);

			const result = await dao.create({
				employee_cuid: 'EMP001',
				effective_from: '2024-01-01',
				effective_to: null,
				status: true
			});

			expect(db.salaryStructure.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					employee_cuid: 'EMP001',
					status: true
				})
			});
			expect(result).toBe(mockResult);
		});

		it('should handle effective_to as null', async () => {
			vi.mocked(db.salaryStructure.create).mockResolvedValue({ id: 1n } as never);
			await dao.create({ employee_cuid: 'EMP001', effective_from: '2024-01-01', effective_to: null, status: true });
			const callArg = vi.mocked(db.salaryStructure.create).mock.calls[0][0];
			expect(callArg.data.effective_to).toBeNull();
		});
	});

	// ─── update ────────────────────────────────────────────────────────────────

	describe('update', () => {
		it('should call db.salaryStructure.update with where cuid', async () => {
			const mockResult = { id: 1n, cuid: 'struct_1', status: false };
			vi.mocked(db.salaryStructure.update).mockResolvedValue(mockResult as never);

			const result = await dao.update('struct_1', { status: false, updated_by: null });

			expect(db.salaryStructure.update).toHaveBeenCalledWith({
				where: { cuid: 'struct_1' },
				data: expect.objectContaining({ status: false })
			});
			expect(result).toBe(mockResult);
		});
	});

	// ─── findByCuid ────────────────────────────────────────────────────────────

	describe('findByCuid', () => {
		it('should return a structure when found', async () => {
			const mockData = { id: 1n, cuid: 'struct_1' };
			vi.mocked(db.salaryStructure.findUnique).mockResolvedValue(mockData as never);

			const result = await dao.findByCuid('struct_1');

			expect(db.salaryStructure.findUnique).toHaveBeenCalledWith({ where: { cuid: 'struct_1' } });
			expect(result).toBe(mockData);
		});

		it('should return null when not found', async () => {
			vi.mocked(db.salaryStructure.findUnique).mockResolvedValue(null);
			const result = await dao.findByCuid('nonexistent');
			expect(result).toBeNull();
		});
	});

	// ─── findByEmployeeCuid ────────────────────────────────────────────────────

	describe('findByEmployeeCuid', () => {
		it('should return a structure when found', async () => {
			const mockData = { id: 1n, cuid: 'struct_1', employee_cuid: 'EMP001' };
			vi.mocked(db.salaryStructure.findFirst).mockResolvedValue(mockData as never);

			const result = await dao.findByEmployeeCuid('EMP001');

			expect(db.salaryStructure.findFirst).toHaveBeenCalledWith({ where: { employee_cuid: 'EMP001' } });
			expect(result).toBe(mockData);
		});

		it('should return null when not found', async () => {
			vi.mocked(db.salaryStructure.findFirst).mockResolvedValue(null);
			const result = await dao.findByEmployeeCuid('nonexistent');
			expect(result).toBeNull();
		});
	});

	// ─── findMany ──────────────────────────────────────────────────────────────

	describe('findMany', () => {
		it('should call db.salaryStructure.findMany ordered by effective_from desc', async () => {
			const mockData = [{ id: 1n, cuid: 'struct_1' }];
			vi.mocked(db.salaryStructure.findMany).mockResolvedValue(mockData as never);

			const result = await dao.findMany();

			expect(db.salaryStructure.findMany).toHaveBeenCalledWith({
				orderBy: { effective_from: 'desc' }
			});
			expect(result).toBe(mockData);
		});
	});

	// ─── createItems ──────────────────────────────────────────────────────────

	describe('createItems', () => {
		it('should create one item per entry', async () => {
			vi.mocked(db.salaryStructureItem.create).mockResolvedValue({ id: 1n, cuid: 'item_1' } as never);

			const items = [
				{ salary_component_cuid: 'comp_a', amount: 1000, created_by: null },
				{ salary_component_cuid: 'comp_b', amount: 2000, created_by: null }
			];

			await dao.createItems('struct_1', items);

			expect(db.salaryStructureItem.create).toHaveBeenCalledTimes(2);
		});
	});

	// ─── deleteItemsByStructureCuid ───────────────────────────────────────────

	describe('deleteItemsByStructureCuid', () => {
		it('should delete all items for a given structure cuid', async () => {
			vi.mocked(db.salaryStructureItem.deleteMany).mockResolvedValue({ count: 3 } as never);

			await dao.deleteItemsByStructureCuid('struct_1');

			expect(db.salaryStructureItem.deleteMany).toHaveBeenCalledWith({
				where: { salary_structure_cuid: 'struct_1' }
			});
		});
	});

	// ─── findItemsByStructureCuid ─────────────────────────────────────────────

	describe('findItemsByStructureCuid', () => {
		it('should return all items for a structure', async () => {
			const mockItems = [
				{ id: 1n, cuid: 'item_1', salary_structure_cuid: 'struct_1', salary_component_cuid: 'comp_a', amount: 1000 }
			];
			vi.mocked(db.salaryStructureItem.findMany).mockResolvedValue(mockItems as never);

			const result = await dao.findItemsByStructureCuid('struct_1');

			expect(db.salaryStructureItem.findMany).toHaveBeenCalledWith({
				where: { salary_structure_cuid: 'struct_1' },
				orderBy: { cuid: 'asc' }
			});
			expect(result).toBe(mockItems);
		});
	});

	// ─── findItemsByStructureCuids ────────────────────────────────────────────

	describe('findItemsByStructureCuids', () => {
		it('should use an "in" query for multiple structure cuids', async () => {
			vi.mocked(db.salaryStructureItem.findMany).mockResolvedValue([] as never);

			await dao.findItemsByStructureCuids(['struct_1', 'struct_2']);

			expect(db.salaryStructureItem.findMany).toHaveBeenCalledWith({
				where: { salary_structure_cuid: { in: ['struct_1', 'struct_2'] } },
				orderBy: { cuid: 'asc' }
			});
		});
	});
});
