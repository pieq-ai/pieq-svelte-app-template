import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	createStructure,
	createRevision,
	updateStructure,
	getStructureByCuid,
	getStructures,
	deactivateStructure,
	SalaryStructureNotFoundError,
	InvalidEmployeeError,
	InvalidSalaryComponentError,
	DuplicateComponentInStructureError,
	ActiveStructureExistsError,
	SourceStructureNotActiveError,
	ConfirmationRequiredError,
	BusinessValidationError
} from '$lib/server/services/salary-structure.service.js';

const mockTx = {
	salaryStructure: {
		update: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn()
	},
	salaryStructureItem: {
		create: vi.fn(),
		deleteMany: vi.fn(),
		findMany: vi.fn()
	}
};

vi.mock('$lib/server/db.js', () => ({
	db: {
		$transaction: vi.fn((callback) => callback(mockTx))
	}
}));

// ─── Mock DAO ─────────────────────────────────────────────────────────────────

vi.mock('$lib/server/dao/salary-structure.dao.js', () => ({
	create: vi.fn(),
	update: vi.fn(),
	findByCuid: vi.fn(),
	findByEmployeeCuid: vi.fn(),
	findActiveByEmployeeCuid: vi.fn(),
	findMany: vi.fn(),
	createItems: vi.fn(),
	deleteItemsByStructureCuid: vi.fn(),
	findItemsByStructureCuid: vi.fn(),
	findItemsByStructureCuids: vi.fn()
}));

vi.mock('$lib/server/dao/salary-component.dao.js', () => ({
	findByCuid: vi.fn()
}));

vi.mock('$lib/server/services/audit.service.js', () => ({
	log: vi.fn().mockResolvedValue(undefined),
	logUpdate: vi.fn().mockResolvedValue(undefined)
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
	return { id: 1n, cuid: 'comp_abc', name: 'Basic', status: true, ...overrides };
}

describe('Salary Structure Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		mockTx.salaryStructure.update.mockResolvedValue(mockStructureRecord());
		mockTx.salaryStructure.findMany.mockResolvedValue([]);
		mockTx.salaryStructure.create.mockResolvedValue(mockStructureRecord());
		mockTx.salaryStructureItem.create.mockResolvedValue(mockItemRecord());
		mockTx.salaryStructureItem.deleteMany.mockResolvedValue({ count: 1 });
		mockTx.salaryStructureItem.findMany.mockResolvedValue([mockItemRecord()]);
		vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([]);
	});

	// ─── createStructure ──────────────────────────────────────────────────────

	describe('createStructure', () => {
		it('should create structure and items, returning serialized data', async () => {
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' });
			vi.mocked(structureDao.findActiveByEmployeeCuid).mockResolvedValue(null as never);
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
			vi.mocked(findEmployeeByCuid).mockResolvedValue(null);

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
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John' });
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
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John' });
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
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John' });
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

		it('should create revision without throwing ConfirmationRequiredError when adjusting open-ended structure (Scenario A / Active Revision)', async () => {
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' });
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([
				mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-01-01'), effective_to: null, status: true })
			] as never);
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord() as never);
			mockTx.salaryStructure.create.mockResolvedValue(mockStructureRecord({ cuid: 'struct_2' }));
			vi.mocked(structureDao.createItems).mockResolvedValue([mockItemRecord()] as never);

			const result = await createStructure({
				employee_cuid: 'EMP001',
				effective_from: '2024-05-01',
				effective_to: null,
				status: true,
				components: [{ salary_component_cuid: 'comp_abc', amount: 100 }],
				confirmAdjustment: false
			});

			expect(mockTx.salaryStructure.update).toHaveBeenCalledWith({
				where: { cuid: 'struct_1' },
				data: { effective_to: new Date('2024-04-30'), status: false }
			});
			expect(result.cuid).toBe('struct_2');
		});

		it('should throw ConfirmationRequiredError when modifying historical structures (Scenario B / Historical modification) and confirmAdjustment is false', async () => {
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' });
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([
				mockStructureRecord({ cuid: 'struct_A', effective_from: new Date('2024-01-01'), effective_to: new Date('2024-06-30'), status: false }),
				mockStructureRecord({ cuid: 'struct_B', effective_from: new Date('2024-07-01'), effective_to: null, status: true })
			] as never);

			await expect(
				createStructure({
					employee_cuid: 'EMP001',
					effective_from: '2024-04-01',
					effective_to: null,
					status: true,
					components: [{ salary_component_cuid: 'comp_abc', amount: 100 }],
					confirmAdjustment: false
				})
			).rejects.toThrow(ConfirmationRequiredError);
		});

		it('should allow modifying historical structures when confirmAdjustment is true', async () => {
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' });
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([
				mockStructureRecord({ cuid: 'struct_A', effective_from: new Date('2024-01-01'), effective_to: new Date('2024-06-30'), status: false }),
				mockStructureRecord({ cuid: 'struct_B', effective_from: new Date('2024-07-01'), effective_to: null, status: true })
			] as never);
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord() as never);
			mockTx.salaryStructure.create.mockResolvedValue(mockStructureRecord({ cuid: 'struct_new' }));
			vi.mocked(structureDao.createItems).mockResolvedValue([mockItemRecord()] as never);

			const result = await createStructure({
				employee_cuid: 'EMP001',
				effective_from: '2024-04-01',
				effective_to: null,
				status: true,
				components: [{ salary_component_cuid: 'comp_abc', amount: 100 }],
				confirmAdjustment: true
			});

			expect(mockTx.salaryStructure.update).toHaveBeenCalledWith({
				where: { cuid: 'struct_A' },
				data: { effective_to: new Date('2024-03-31'), status: false }
			});
			expect(result.cuid).toBe('struct_new');
		});

		it('should throw BusinessValidationError (Scenario C) when dates cannot be resolved (duplicate effective_from)', async () => {
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP001', employee_id: 'EMP001', name: 'John Doe' });
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([
				mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-01-01'), effective_to: null })
			] as never);

			await expect(
				createStructure({
					employee_cuid: 'EMP001',
					effective_from: '2024-01-01',
					effective_to: null,
					status: true,
					components: [{ salary_component_cuid: 'comp_abc', amount: 100 }],
					confirmAdjustment: true
				})
			).rejects.toThrow(BusinessValidationError);
		});
	});

	// ─── createRevision ───────────────────────────────────────────────────────

	describe('createRevision', () => {
		it('should create revision, closing previous active structure', async () => {
			const source = mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-01-01') });
			vi.mocked(structureDao.findByCuid).mockResolvedValue(source as never);
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord() as never);
			vi.mocked(structureDao.create).mockResolvedValue(mockStructureRecord({ cuid: 'struct_2' }) as never);
			vi.mocked(structureDao.createItems).mockResolvedValue([mockItemRecord()] as never);

			const result = await createRevision('struct_1', {
				effective_from: '2024-06-01',
				components: [{ salary_component_cuid: 'comp_abc', amount: 6000 }]
			});

			expect(structureDao.update).toHaveBeenCalledWith('struct_1', expect.objectContaining({
				status: false,
				effective_to: '2024-05-31'
			}));
			expect(result.cuid).toBe('struct_2');
		});

		it('should throw SourceStructureNotActiveError if source is inactive', async () => {
			const source = mockStructureRecord({ cuid: 'struct_1', status: false });
			vi.mocked(structureDao.findByCuid).mockResolvedValue(source as never);

			await expect(
				createRevision('struct_1', {
					effective_from: '2024-06-01',
					components: [{ salary_component_cuid: 'comp_abc', amount: 6000 }]
				})
			).rejects.toThrow(SourceStructureNotActiveError);
		});

		it('should throw BusinessValidationError if new revision overlaps with an ongoing source structure (Scenario B)', async () => {
			const source = mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-06-01'), effective_to: null });
			vi.mocked(structureDao.findByCuid).mockResolvedValue(source as never);

			await expect(
				createRevision('struct_1', {
					effective_from: '2024-06-01',
					components: [{ salary_component_cuid: 'comp_abc', amount: 6000 }]
				})
			).rejects.toThrow("New salary structures must start after the current active structure's effective period.");

			await expect(
				createRevision('struct_1', {
					effective_from: '2024-05-15',
					components: [{ salary_component_cuid: 'comp_abc', amount: 6000 }]
				})
			).rejects.toThrow("New salary structures must start after the current active structure's effective period.");
		});

		it('should throw BusinessValidationError if new revision overlaps with a bounded source structure (Scenario A)', async () => {
			const source = mockStructureRecord({
				cuid: 'struct_1',
				effective_from: new Date('2024-01-01'),
				effective_to: new Date('2024-06-30')
			});
			vi.mocked(structureDao.findByCuid).mockResolvedValue(source as never);

			await expect(
				createRevision('struct_1', {
					effective_from: '2024-06-15',
					components: [{ salary_component_cuid: 'comp_abc', amount: 6000 }]
				})
			).rejects.toThrow("New salary structures must start after the current active structure's effective period.");
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
		beforeEach(() => {
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([mockStructureRecord()] as never);
		});

		it('should update structure fields without touching items', async () => {
			const original = mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-01-01') });
			vi.mocked(structureDao.findByCuid).mockResolvedValue(original as never);
			
			// Mock the transaction update for salaryStructure
			const updatedRecord = mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-02-01') });
			mockTx.salaryStructure.update.mockResolvedValue(updatedRecord);
			
			const result = await updateStructure('struct_1', { effective_from: '2024-02-01', confirmAdjustment: true });

			expect(mockTx.salaryStructure.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { cuid: 'struct_1' },
				data: expect.objectContaining({
					effective_from: new Date('2024-02-01')
				})
			}));
			expect(result.effective_from).toBe('2024-02-01');
		});

		it('should update effective_to correctly for the current active structure', async () => {
			const original = mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-01-01'), effective_to: null, status: true });
			vi.mocked(structureDao.findByCuid).mockResolvedValue(original as never);
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([original] as never);

			const updatedRecord = mockStructureRecord({ cuid: 'struct_1', effective_from: new Date('2024-01-01'), effective_to: new Date('2024-12-31'), status: true });
			mockTx.salaryStructure.update.mockResolvedValue(updatedRecord);

			const result = await updateStructure('struct_1', { effective_to: '2024-12-31', confirmAdjustment: true });

			expect(mockTx.salaryStructure.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { cuid: 'struct_1' },
				data: expect.objectContaining({
					effective_to: new Date('2024-12-31'),
					status: true
				})
			}));
			expect(result.effective_to).toBe('2024-12-31');
		});

		it('should replace items when items array is provided', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(componentDao.findByCuid).mockResolvedValue(mockComponentRecord() as never);
			
			// Mock transaction create/delete resolved values
			mockTx.salaryStructureItem.deleteMany.mockResolvedValue({ count: 1 });
			mockTx.salaryStructureItem.create.mockResolvedValue(mockItemRecord({ amount: 9000 }));

			const result = await updateStructure('struct_1', {
				components: [{ salary_component_cuid: 'comp_abc', amount: 9000 }]
			});

			expect(mockTx.salaryStructureItem.deleteMany).toHaveBeenCalledWith({
				where: { salary_structure_cuid: 'struct_1' }
			});
			expect(mockTx.salaryStructureItem.create).toHaveBeenCalled();
			expect(result.components).toHaveLength(1);
			expect(result.components[0].amount).toBe(9000);
		});

		it('should throw SalaryStructureNotFoundError when not found', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(null);

			await expect(updateStructure('bad_cuid', { status: false })).rejects.toThrow(
				SalaryStructureNotFoundError
			);
		});

		it('should throw InvalidEmployeeError when updating to a bad employee', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord() as never);
			vi.mocked(findEmployeeByCuid).mockResolvedValue(null);

			await expect(updateStructure('struct_1', { employee_cuid: 'BAD' })).rejects.toThrow(
				InvalidEmployeeError
			);
		});

		it('should NOT throw when changing employee (no Active-structure constraint on updateStructure)', async () => {
			const original = mockStructureRecord({ employee_cuid: 'EMP001' });
			vi.mocked(structureDao.findByCuid).mockResolvedValue(original as never);
			vi.mocked(findEmployeeByCuid).mockResolvedValue({ cuid: 'EMP002', employee_id: 'EMP002', name: 'Jane' });
			vi.mocked(structureDao.update).mockResolvedValue(mockStructureRecord({ employee_cuid: 'EMP002' }) as never);
			vi.mocked(structureDao.findItemsByStructureCuid).mockResolvedValue([mockItemRecord()] as never);

			// updateStructure no longer enforces active-structure-per-employee — that is
			// handled only by createStructure / createRevision.
			await expect(
				updateStructure('struct_1', { employee_cuid: 'EMP002' })
			).resolves.toBeDefined();
		});

		it('should throw BusinessValidationError when date range is invalid', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(mockStructureRecord({ effective_from: new Date('2024-01-01') }) as never);

			await expect(
				updateStructure('struct_1', { effective_to: '2023-01-01' })
			).rejects.toThrow('Effective To must be greater than Effective From.');
		});

		it('should auto-adjust neighboring structures (Scenario B) on update when confirmAdjustment is true', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(
				mockStructureRecord({ cuid: 'struct_2', employee_cuid: 'EMP001', effective_from: new Date('2025-01-01'), effective_to: null, status: true }) as never
			);
			
			const other = mockStructureRecord({
				cuid: 'struct_1',
				employee_cuid: 'EMP001',
				effective_from: new Date('2024-01-01'),
				effective_to: new Date('2024-12-31'),
				status: false
			});

			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([
				other,
				mockStructureRecord({ cuid: 'struct_2', employee_cuid: 'EMP001', effective_from: new Date('2025-01-01'), effective_to: null, status: true })
			] as never);

			const updatedRecord = mockStructureRecord({ cuid: 'struct_2', employee_cuid: 'EMP001', effective_from: new Date('2024-06-01'), effective_to: null, status: true });
			mockTx.salaryStructure.update.mockResolvedValue(updatedRecord);

			const result = await updateStructure('struct_2', { effective_from: '2024-06-01', confirmAdjustment: true });

			expect(mockTx.salaryStructure.update).toHaveBeenCalledWith({
				where: { cuid: 'struct_1' },
				data: {
					effective_to: new Date('2024-05-31'),
					status: false
				}
			});
			expect(result.effective_from).toBe('2024-06-01');
		});

		it('should throw BusinessValidationError (Scenario C) on update when duplicate effective_from occurs', async () => {
			vi.mocked(structureDao.findByCuid).mockResolvedValue(
				mockStructureRecord({ cuid: 'struct_2', employee_cuid: 'EMP001', effective_from: new Date('2025-01-01'), effective_to: null, status: true }) as never
			);
			
			const other = mockStructureRecord({
				cuid: 'struct_1',
				employee_cuid: 'EMP001',
				effective_from: new Date('2024-01-01'),
				effective_to: new Date('2024-12-31'),
				status: false
			});

			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([
				other,
				mockStructureRecord({ cuid: 'struct_2', employee_cuid: 'EMP001', effective_from: new Date('2025-01-01'), effective_to: null, status: true })
			] as never);

			await expect(
				updateStructure('struct_2', { effective_from: '2024-01-01' })
			).rejects.toThrow(BusinessValidationError);
		});

		it('should throw ConfirmationRequiredError (Scenario B) on update when modifying historical structures and confirmAdjustment is false', async () => {
			const structA = mockStructureRecord({ cuid: 'struct_A', employee_cuid: 'EMP001', effective_from: new Date('2024-01-01'), effective_to: new Date('2024-06-30'), status: false });
			const structB = mockStructureRecord({ cuid: 'struct_B', employee_cuid: 'EMP001', effective_from: new Date('2024-07-01'), effective_to: null, status: true });

			vi.mocked(structureDao.findByCuid).mockResolvedValue(structB as never);
			vi.mocked(structureDao.findByEmployeeCuid).mockResolvedValue([structA, structB] as never);

			await expect(
				updateStructure('struct_B', { effective_from: '2024-06-01', confirmAdjustment: false })
			).rejects.toThrow(ConfirmationRequiredError);
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
