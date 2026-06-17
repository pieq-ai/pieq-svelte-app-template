import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/dao/employee.dao', () => ({
	list: vi.fn(),
	create: vi.fn()
}));

import * as employeeDao from '$lib/server/dao/employee.dao';
import {
	createEmployee,
	EmployeeValidationError,
	listEmployees
} from '$lib/server/services/employee.service';

const mockedDao = vi.mocked(employeeDao);

const sampleEmployee = {
	id: 1n,
	uuid: '11111111-1111-4111-8111-111111111111',
	name: 'Ada Lovelace',
	age: 36
};

describe('employee.service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('listEmployees', () => {
		it('returns the DAO result unchanged', async () => {
			mockedDao.list.mockResolvedValueOnce([sampleEmployee]);

			const result = await listEmployees();

			expect(result).toEqual([sampleEmployee]);
			expect(mockedDao.list).toHaveBeenCalledOnce();
		});

		it('propagates DAO errors instead of swallowing them', async () => {
			mockedDao.list.mockRejectedValueOnce(new Error('connection refused'));

			await expect(listEmployees()).rejects.toThrow('connection refused');
		});
	});

	describe('createEmployee', () => {
		it('trims the name and forwards a coerced numeric age to the DAO', async () => {
			mockedDao.create.mockResolvedValueOnce(sampleEmployee);

			const result = await createEmployee({ name: '  Ada Lovelace  ', age: '36' });

			expect(mockedDao.create).toHaveBeenCalledWith({ name: 'Ada Lovelace', age: 36 });
			expect(result).toEqual(sampleEmployee);
		});

		it('rejects a non-string name', async () => {
			await expect(createEmployee({ name: 42, age: 30 })).rejects.toThrow(
				EmployeeValidationError
			);
			expect(mockedDao.create).not.toHaveBeenCalled();
		});

		it('rejects an empty / whitespace-only name', async () => {
			await expect(createEmployee({ name: '   ', age: 30 })).rejects.toMatchObject({
				name: 'EmployeeValidationError',
				field: 'name'
			});
		});

		it('rejects a name longer than 100 characters', async () => {
			await expect(
				createEmployee({ name: 'a'.repeat(101), age: 30 })
			).rejects.toMatchObject({ field: 'name' });
		});

		it('rejects a non-numeric age', async () => {
			await expect(createEmployee({ name: 'Ada', age: 'thirty' })).rejects.toMatchObject({
				field: 'age'
			});
		});

		it('rejects a non-integer age', async () => {
			await expect(createEmployee({ name: 'Ada', age: 30.5 })).rejects.toMatchObject({
				field: 'age'
			});
		});

		it.each([0, -1, 121, 1000])('rejects age %i (out of range)', async (age) => {
			await expect(createEmployee({ name: 'Ada', age })).rejects.toMatchObject({
				field: 'age'
			});
		});

		it('propagates DAO errors instead of swallowing them', async () => {
			mockedDao.create.mockRejectedValueOnce(new Error('unique constraint violated'));

			await expect(createEmployee({ name: 'Ada', age: 36 })).rejects.toThrow(
				'unique constraint violated'
			);
		});
	});
});
