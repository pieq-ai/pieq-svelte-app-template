 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as masterDataService from '$lib/server/services/master-data.service.js';
import * as masterDataDao from '$lib/server/dao/master-data.dao.js';

vi.mock('$lib/server/dao/master-data.dao.js', () => ({
	list: vi.fn(),
	findByCuid2: vi.fn(),
	create: vi.fn(),
	update: vi.fn()
}));

// We'll mock the config module to avoid needing its real implementation if we just want pure unit tests
vi.mock('$lib/master-data/master-config.js', () => ({
	isMasterKey: vi.fn((key) => ['blood-groups', 'states', 'languages', 'countries'].includes(key)),
	getMasterConfig: vi.fn((key) => {
		switch (key) {
			case 'blood-groups': return { label: 'Blood Group', idField: 'id', nameField: 'blood_group_name' };
			case 'states': return { label: 'State', idField: 'id', nameField: 'state_name' };
			case 'languages': return { label: 'Language', idField: 'id', nameField: 'languages_name' };
			case 'countries': return { label: 'Country', idField: 'id', nameField: 'country_name' };
			default: return { label: 'Unknown', idField: 'id', nameField: 'name' };
		}
	})
}));

describe('Master Data Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getMasterData', () => {
		it('should throw an error for unsupported master type', async () => {
			await expect(masterDataService.getMasterData('invalid-type')).rejects.toThrow('Unsupported master data type');
		});

		it('should return mapped master data options', async () => {
			const mockData = [
				{ id: 1, cuid: 'bg1', blood_group_name: 'O+', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ id: 2, cuid: 'bg2', blood_group_name: 'A+', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			];
			vi.mocked(masterDataDao.list).mockResolvedValue(mockData as any);

			const result = await masterDataService.getMasterData('blood-groups');

			expect(masterDataDao.list).toHaveBeenCalledWith('blood-groups');
			expect(result).toEqual([
				{ id: 'bg1', label: 'O+', master: 'blood-groups', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null },
				{ id: 'bg2', label: 'A+', master: 'blood-groups', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }
			]);
		});

		it('should filter by search query', async () => {
			const mockData = [
				{ id: 1, cuid: 'l1', languages_name: 'English' },
				{ id: 2, cuid: 'l2', languages_name: 'Spanish' }
			];
			vi.mocked(masterDataDao.list).mockResolvedValue(mockData as any);

			const result = await masterDataService.getMasterData('languages', 'eng');
			expect(result).toHaveLength(1);
			expect(result[0].label).toBe('English');
		});

		it('should throw if country is provided for states but not found', async () => {
			vi.mocked(masterDataDao.list).mockResolvedValue([]);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue(null);

			await expect(masterDataService.getMasterData('states', '', 'missing-country')).rejects.toThrow('Country not found');
		});

		it('should filter states by country_cuid', async () => {
			const mockData = [
				{ id: 1, cuid: 's1', state_name: 'California', country_cuid: 'c1' },
				{ id: 2, cuid: 's2', state_name: 'Texas', country_cuid: 'c1' },
				{ id: 3, cuid: 's3', state_name: 'Ontario', country_cuid: 'c2' }
			];
			vi.mocked(masterDataDao.list).mockResolvedValue(mockData as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1, country_name: 'USA' } as any);

			const result = await masterDataService.getMasterData('states', '', 'c1');
			expect(result).toHaveLength(2);
			expect(result[0].label).toBe('California');
			expect(result[1].label).toBe('Texas');
		});
	});

	describe('createMasterData', () => {
		describe('name validation', () => {
			it('should throw if name is missing or empty', async () => {
				await expect(masterDataService.createMasterData('blood-groups', { name: '' })).rejects.toThrow('Blood Group is required');
				await expect(masterDataService.createMasterData('blood-groups', { name: '   ' })).rejects.toThrow('Blood Group is required');
				await expect(masterDataService.createMasterData('blood-groups', { name: null as any })).rejects.toThrow('Blood Group is required');
			});

			it('should throw if name exceeds 100 characters', async () => {
				const longName = 'A'.repeat(101);
				await expect(masterDataService.createMasterData('blood-groups', { name: longName })).rejects.toThrow('Blood Group cannot exceed 100 characters');
			});

			it('should validate blood groups strictly', async () => {
				await expect(masterDataService.createMasterData('blood-groups', { name: 'C+' })).rejects.toThrow('Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, O-');
				
				vi.mocked(masterDataDao.list).mockResolvedValue([]);
				vi.mocked(masterDataDao.create).mockResolvedValue({ cuid: 'bg3', blood_group_name: 'O+', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);
				const res = await masterDataService.createMasterData('blood-groups', { name: 'o+' }); // should uppercase
				expect(res.label).toBe('O+');
			});

			it('should validate languages strictly (letters and spaces only)', async () => {
				await expect(masterDataService.createMasterData('languages', { name: 'English 123' })).rejects.toThrow('Language must contain only letters and spaces');
			});

			it('should validate default entities strictly (letters, numbers, spaces)', async () => {
				await expect(masterDataService.createMasterData('countries', { name: 'USA!' })).rejects.toThrow('Country must contain only letters, numbers, and spaces');
			});
		});

		describe('state creation', () => {
			it('should throw if country is missing for states', async () => {
				await expect(masterDataService.createMasterData('states', { name: 'California' })).rejects.toThrow('Country is required for states');
			});

			it('should throw if country is not found', async () => {
				vi.mocked(masterDataDao.findByCuid2).mockResolvedValue(null);
				await expect(masterDataService.createMasterData('states', { name: 'California', country_cuid: 'invalid' })).rejects.toThrow('Country not found');
			});
		});

		it('should throw if entry already exists (duplicate name)', async () => {
			vi.mocked(masterDataDao.list).mockResolvedValue([{ cuid: 'bg1', blood_group_name: 'O+' }] as any);
			await expect(masterDataService.createMasterData('blood-groups', { name: 'O+' })).rejects.toThrow('Blood Group already exists');
		});

		it('should allow duplicate name in states if country is different', async () => {
			vi.mocked(masterDataDao.list).mockResolvedValue([
				{ cuid: 's1', state_name: 'Georgia', country_cuid: 'c1' }
			] as any);
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1 } as any);
			vi.mocked(masterDataDao.create).mockResolvedValue({ cuid: 's2', state_name: 'Georgia' } as any);

			await expect(masterDataService.createMasterData('states', { name: 'Georgia', country_cuid: 'c2' })).resolves.toBeDefined();
		});

		it('should successfully create and return Option', async () => {
			vi.mocked(masterDataDao.list).mockResolvedValue([]);
			vi.mocked(masterDataDao.create).mockResolvedValue({ cuid: 'l1', languages_name: 'French', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await masterDataService.createMasterData('languages', { name: 'French' });
			expect(result).toEqual({ id: 'l1', label: 'French', master: 'languages', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
		});
	});

	describe('updateMasterData', () => {
		it('should throw if record not found', async () => {
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue(null);
			await expect(masterDataService.updateMasterData('blood-groups', 'invalid', { name: 'A+' })).rejects.toThrow('Blood Group not found');
		});

		it('should throw if state country is missing during update', async () => {
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 's1', state_name: 'Texas' } as any);
			await expect(masterDataService.updateMasterData('states', 's1', { name: 'Texas Updated' })).rejects.toThrow('Country is required for states');
		});

		it('should throw if duplicate name exists on another record', async () => {
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'bg1', blood_group_name: 'A+' } as any); // current record
			vi.mocked(masterDataDao.list).mockResolvedValue([{ cuid: 'bg2', blood_group_name: 'O+' }] as any); // other record

			await expect(masterDataService.updateMasterData('blood-groups', 'bg1', { name: 'O+' })).rejects.toThrow('Blood Group already exists');
		});

		it('should successfully update and return Option', async () => {
			vi.mocked(masterDataDao.findByCuid2).mockResolvedValue({ id: 1, cuid: 'l1', languages_name: 'Old French', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);
			vi.mocked(masterDataDao.list).mockResolvedValue([{ cuid: 'l1', languages_name: 'Old French', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null }] as any);
			vi.mocked(masterDataDao.update).mockResolvedValue({ cuid: 'l1', languages_name: 'French', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null } as any);

			const result = await masterDataService.updateMasterData('languages', 'l1', { name: 'French' });
			expect(result).toEqual({ id: 'l1', label: 'French', master: 'languages', created_at: new Date('2026-05-29T12:00:00Z'), created_by: null, updated_at: new Date('2026-05-29T12:00:00Z'), updated_by: null });
			expect(masterDataDao.update).toHaveBeenCalled();
		});
	});
});
