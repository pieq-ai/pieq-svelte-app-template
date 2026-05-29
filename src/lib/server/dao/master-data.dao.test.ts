import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as masterDataDao from './master-data.dao.js';
import { db } from '$lib/server/db.js';
import type { MasterKey } from '$lib/master-data/master-config.js';

const { mockDbMethods } = vi.hoisted(() => ({
	mockDbMethods: {
		findMany: vi.fn(),
		findUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn()
	}
}));

vi.mock('$lib/server/db.js', () => ({
	db: {
		bloodGroup: mockDbMethods,
		payGrade: mockDbMethods,
		nationality: mockDbMethods,
		employmentType: mockDbMethods,
		relationType: mockDbMethods,
		documentType: mockDbMethods,
		state: mockDbMethods,
		country: mockDbMethods,
		skills: mockDbMethods,
		attendanceSource: mockDbMethods,
		languages: mockDbMethods
	}
}));

const masterKeys: MasterKey[] = [
	'blood-groups',
	'pay-grades',
	'nationalities',
	'employment-types',
	'relation-types',
	'document-types',
	'states',
	'countries',
	'skills',
	'attendance-sources',
	'languages'
];

describe('Master Data DAO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list', () => {
		it.each(masterKeys)('should call findMany with correct order for %s', async (master) => {
			const mockData = [{ id: 1 }];
			mockDbMethods.findMany.mockResolvedValueOnce(mockData);

			const result = await masterDataDao.list(master);

			expect(mockDbMethods.findMany).toHaveBeenCalledTimes(1);
			expect(result).toBe(mockData);

			if (master === 'states') {
				expect(mockDbMethods.findMany).toHaveBeenCalledWith({
					orderBy: [{ country_cuid2: 'asc' }, { state_name: 'asc' }]
				});
			} else {
				// Assert it was called with some orderBy containing 'asc'
				const callArgs = mockDbMethods.findMany.mock.calls[0][0];
				expect(callArgs).toHaveProperty('orderBy');
				const orderByKey = Object.keys(callArgs.orderBy)[0];
				expect(callArgs.orderBy[orderByKey]).toBe('asc');
			}
		});
	});

	describe('findById', () => {
		it.each(masterKeys)('should call findUnique with correct id for %s', async (master) => {
			const mockData = { id: 10 };
			mockDbMethods.findUnique.mockResolvedValueOnce(mockData);

			const result = await masterDataDao.findById(master, 10);

			expect(mockDbMethods.findUnique).toHaveBeenCalledTimes(1);
			expect(mockDbMethods.findUnique).toHaveBeenCalledWith({ where: { id: 10 } });
			expect(result).toBe(mockData);
		});
	});

	describe('findByCuid2', () => {
		it.each(masterKeys)('should call findUnique with correct cuid2 for %s', async (master) => {
			const mockData = { id: 10, cuid2: 'abc' };
			mockDbMethods.findUnique.mockResolvedValueOnce(mockData);

			const result = await masterDataDao.findByCuid2(master, 'abc');

			expect(mockDbMethods.findUnique).toHaveBeenCalledTimes(1);
			expect(mockDbMethods.findUnique).toHaveBeenCalledWith({ where: { cuid2: 'abc' } });
			expect(result).toBe(mockData);
		});
	});

	describe('create', () => {
		it.each(masterKeys)('should call create with correct mapped fields for %s', async (master) => {
			const mockData = { id: 1, name: 'TestValue' };
			mockDbMethods.create.mockResolvedValueOnce(mockData);

			const data = { name: 'New Entry', country_cuid2: 'cntry123' };
			const result = await masterDataDao.create(master, data);

			expect(mockDbMethods.create).toHaveBeenCalledTimes(1);
			expect(result).toBe(mockData);

			const callArgs = mockDbMethods.create.mock.calls[0][0];
			if (master === 'states') {
				expect(callArgs.data.state_name).toBe('New Entry');
				expect(callArgs.data.country_cuid2).toBe('cntry123');
			} else {
				// The generic mapped name field
				const nameKey = Object.keys(callArgs.data)[0];
				expect(callArgs.data[nameKey]).toBe('New Entry');
			}
		});

		it('should fallback to empty string for country_cuid2 when states is missing it', async () => {
			mockDbMethods.create.mockResolvedValueOnce({});
			await masterDataDao.create('states', { name: 'State A' });
			expect(mockDbMethods.create).toHaveBeenCalledWith({
				data: { state_name: 'State A', country_cuid2: '' }
			});
		});
	});

	describe('update', () => {
		it.each(masterKeys)('should call update with correct mapped fields for %s', async (master) => {
			const mockData = { id: 5, name: 'UpdatedValue' };
			mockDbMethods.update.mockResolvedValueOnce(mockData);

			const data = { id: 5, name: 'Updated Entry', country_cuid2: 'cntry123' };
			const result = await masterDataDao.update(master, data);

			expect(mockDbMethods.update).toHaveBeenCalledTimes(1);
			expect(result).toBe(mockData);

			const callArgs = mockDbMethods.update.mock.calls[0][0];
			expect(callArgs.where.id).toBe(5);

			if (master === 'states') {
				expect(callArgs.data.state_name).toBe('Updated Entry');
				expect(callArgs.data.country_cuid2).toBe('cntry123');
			} else {
				const nameKey = Object.keys(callArgs.data)[0];
				expect(callArgs.data[nameKey]).toBe('Updated Entry');
			}
		});

		it('should fallback to empty string for country_cuid2 when updating states without it', async () => {
			mockDbMethods.update.mockResolvedValueOnce({});
			await masterDataDao.update('states', { id: 2, name: 'State B' });
			expect(mockDbMethods.update).toHaveBeenCalledWith({
				where: { id: 2 },
				data: { state_name: 'State B', country_cuid2: '' }
			});
		});
	});
});
