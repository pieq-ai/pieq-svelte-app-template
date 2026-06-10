import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	createStructure,
	updateStructure,
	getStructureByCuid,
	getStructures,
	deactivateStructure,
	SalaryStructureNotFoundError,
	InvalidEmployeeError,
	InvalidSalaryComponentError,
	DuplicateComponentInStructureError,
	DuplicateEmployeeStructureError
} from '$lib/server/services/salary-structure.service.js';

// ─── Mock DAO ─────────────────────────────────────────────────────────────────

vi.mock('$lib/server/dao/salary-structure.dao.js', () => ({
	create: vi.fn(),
	update: vi.fn(),
	findByCuid: vi.fn(),
	findByEmployeeCuid: vi.fn(),
	findMany: vi.fn(),
	createItems: vi.fn(),
	deleteItemsByStructureCuid: vi.fn(),
	findItemsByStructureCuid: vi.fn(),
	findItemsByStructureCuids: vi.fn()
}));

vi.mock('$lib/server/dao/salary-component.dao.js', () => ({
	findByCuid: vi.fn()
}));

vi.mock('$lib/server/providers/employee.provider.js', () => ({
	findEmployeeByCuid: vi.fn()
}));

// ─── Import mocked modules ────────────────────────────────────────────────────

import * as structureDao from '$lib/server/dao/salary-structure.dao.js';
import * as componentDao from '$lib/server/dao/salary-component.dao.js';
import { findEmployeeByCuid } from '$lib/server/providers/employee.provider.js';

// ─── Builders ─────────────────────────────────────────────────────────────────

function mockStructureRecord(overrides = {}) {
	return {
		id: 1n,
		cuid: 'struct_1',
		employee_cuid: 'EMP001',
		effective_from: new Date('2024-01-01'),
		effective_to: null,
		status: true,
		created_at: new Date(),
		created_by: null,
		updated_at: new Date(),
		updated_by: null,
		...overrides
	};
}

function mockItemRecord(overrides = {}) {
	return {
		id: 2n,
		cuid: 'item_1',
		salary_structure_cuid: 'struct_1',
		salary_component_cuid: 'comp_abc',
		amount: 5000,
		created_at: new Date(),
		created_by: null,
		updated_at: new Date(),
		updated_by: null,
		...overrides
	};
}

function mockComponentRecord(overrides = {}) {
	return { id: 1n, cuid: 'comp_abc', component_name: 'Basic', status: true, ...overrides };
}

describe('Salary Structure Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ─── createStructure ──────────────────────────────────────────────────────

	describe('createStructure', () => {
		it('should create structure and items, returning serialized data', async () => {
			vi.mocked(findEmployeeByCuid).mockReturnValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' });
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord() as never);
			vi.mocked(structureDao.create).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(structureDao.createItems).mockResolvedValue([mockItemRecord()] as never);

			const result = await createStructure({
				employee_cuid: 'EMP001',
				effective_from: '2024-01-01',
				effective_to: null,
				status: true,
				components: [{ salary_component_cuid: 'comp_abc', amount: 5000 }]
			});

			expect(result.employee_cuid).toBe('EMP001');
			expect(result.components).toHaveLength(1);
			expect(result.components[0].amount).toBe(5000);
		});

		it('should throw InvalidEmployeeError when employee does not exist', async () => {
			vi.mocked(findEmployeeByCuid).mockReturnValue(null);

			await expect(
				createStructure({
					employee_cuid: 'BAD_EMP',
					effective_from: '2024-01-01',
					effective_to: null,
					status: true,
					components: [{ salary_component_cuid: 'comp_abc', amount: 100 }]
				})
			).rejects.toThrow(InvalidEmployeeError);
		});

		it('should throw InvalidSalaryComponentError when component not found', async () => {
			vi.mocked(findEmployeeByCuid).mockReturnValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John' });
			vi.mocked(componentDao.findByCuid).mockResolvedValue(null);

			await expect(
				createStructure({
					employee_cuid: 'EMP001',
					effective_from: '2024-01-01',
					effective_to: null,
					status: true,
					components: [{ salary_component_cuid: 'bad_comp', amount: 100 }]
				})
			).rejects.toThrow(InvalidSalaryComponentError);
		});

		it('should throw InvalidSalaryComponentError when component is inactive', async () => {
			vi.mocked(findEmployeeByCuid).mockReturnValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John' });
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord({ status: false }) as never);

			await expect(
				createStructure({
					employee_cuid: 'EMP001',
					effective_from: '2024-01-01',
					effective_to: null,
					status: true,
					components: [{ salary_component_cuid: 'comp_abc', amount: 100 }]
				})
			).rejects.toThrow(InvalidSalaryComponentError);
		});

		it('should throw DuplicateComponentInStructureError on duplicate items', async () => {
			vi.mocked(findEmployeeByCuid).mockReturnValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John' });
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord() as never);

			await expect(
				createStructure({
					employee_cuid: 'EMP001',
					effective_from: '2024-01-01',
					effective_to: null,
					status: true,
					components: [
						{ salary_component_cuid: 'comp_abc', amount: 100 },
						{ salary_component_cuid: 'comp_abc', amount: 200 }
					]
				})
			).rejects.toThrow(DuplicateComponentInStructureError);
		});

		it('should throw DuplicateEmployeeStructureError when employee already has a structure', async () => {
			vi.mocked(findEmployeeByCuid).mockReturnValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' });
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue(mockStructureRecord() as never);

			await expect(
				createStructure({
					employee_cuid: 'EMP001',
					effective_from: '2024-01-01',
					effective_to: null,
					status: true,
					components: [{ salary_component_cuid: 'comp_abc', amount: 100 }]
				})
			).rejects.toThrow(DuplicateEmployeeStructureError);
		});
	});

	// ─── getStructures ────────────────────────────────────────────────────────

	describe('getStructures', () => {
		it('should return empty array when no structures exist', async () => {
			vi.mocked(structureDao.findMany).mockResolvedValue([]);

			const result = await getStructures();

			expect(result).toEqual([]);
		});

		it('should batch-fetch items and group them correctly', async () => {
			const structure = mockStructureRecord();
			const items = [mockItemRecord()];

			vi.mocked(structureDao.findMany).mockResolvedValue([structure] as never);
			vi.mocked(structureDao.findItemsByStructureCuids).mockResolvedValue(items as never);

			const result = await getStructures();

			expect(structureDao.findItemsByStructureCuids).toHaveBeenCalledWith(['struct_1']);
			expect(result).toHaveLength(1);
			expect(result[0].cuid).toBe('struct_1');
		});
	});

	// ─── getStructureByCuid ───────────────────────────────────────────────────

	describe('getStructureByCuid', () => {
		it('should return the serialized structure with items', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(structureDao.findItemsByStructureCuid).mockResolvedValue([mockItemRecord()] as never);

			const result = await getStructureByCuid('struct_1');

			expect(result.cuid).toBe('struct_1');
			expect(result.components).toHaveLength(1);
		});

		it('should throw SalaryStructureNotFoundError when not found', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(null);

			await expect(getStructureByCuid('nonexistent')).rejects.toThrow(SalaryStructureNotFoundError);
		});
	});

	// ─── updateStructure ─────────────────────────────────────────────────────

	describe('updateStructure', () => {
		it('should update structure fields without touching items', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(structureDao.update).mockResolvedValue(mockStructureRecord({ status: false }) as never);
			vi.mocked(structureDao.findItemsByStructureCuid).mockResolvedValue([mockItemRecord()] as never);

			const result = await updateStructure('struct_1', { status: false });

			expect(structureDao.update).toHaveBeenCalledWith('struct_1', expect.objectContaining({ status: false }));
			expect(result.status).toBe(false);
		});

		it('should replace items when items array is provided', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(structureDao.update).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord() as never);
			vi.mocked(structureDao.deleteItemsByStructureCuid).mockResolvedValue({ count: 1 } as never);
			vi.mocked(structureDao.createItems).mockResolvedValue([mockItemRecord()] as never);

			await updateStructure('struct_1', {
				components: [{ salary_component_cuid: 'comp_abc', amount: 9000 }]
			});

			expect(structureDao.deleteItemsByStructureCuid).toHaveBeenCalledWith('struct_1');
			expect(structureDao.createItems).toHaveBeenCalled();
		});

		it('should throw SalaryStructureNotFoundError when not found', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(null);

			await expect(updateStructure('bad_cuid', { status: false })).rejects.toThrow(
				SalaryStructureNotFoundError
			);
		});

		it('should throw InvalidEmployeeError when updating to a bad employee', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(findEmployeeByCuid).mockReturnValue(null);

			await expect(updateStructure('struct_1', { employee_cuid: 'BAD' })).rejects.toThrow(
				InvalidEmployeeError
			);
		});

		it('should throw DuplicateEmployeeStructureError when changing employee to one who already has a structure', async () => {
			const original = mockStructureRecord({ employee_cuid: 'EMP001' });
			vi.mocked(structureDao.findByCuid).mockResolvedValue(original as never);
			vi.mocked(findEmployeeByCuid).mockReturnValue({ cuid: 'EMP002', employee_id: 'EMP002', name: 'Jane' });
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue(mockStructureRecord({ cuid: 'struct_2', employee_cuid: 'EMP002' }) as never);

			await expect(
				updateStructure('struct_1', { employee_cuid: 'EMP002' })
			).rejects.toThrow(DuplicateEmployeeStructureError);
		});
	});

	// ─── deactivateStructure ──────────────────────────────────────────────────

	describe('deactivateStructure', () => {
		it('should set status to false', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(structureDao.update).mockResolvedValue(mockStructureRecord({ status: false }) as never);
			vi.mocked(structureDao.findItemsByStructureCuid).mockResolvedValue([] as never);

			const result = await deactivateStructure('struct_1');

			expect(structureDao.update).toHaveBeenCalledWith(
				'struct_1',
				expect.objectContaining({ status: false })
			);
			expect(result.status).toBe(false);
		});

		it('should throw SalaryStructureNotFoundError when not found', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(null);

			await expect(deactivateStructure('missing')).rejects.toThrow(SalaryStructureNotFoundError);
		});
	});
});
