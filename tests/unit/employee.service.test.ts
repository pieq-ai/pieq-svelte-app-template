/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';

vi.mock('$lib/server/dao/employee.dao.js', () => ({
	list: vi.fn(),
	findByCuid2: vi.fn(),
	findByEmpCode: vi.fn(),
	findByEmail: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
    remove: vi.fn()
}));

describe('Employee Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getEmployees', () => {
		it('should return mapped public employees', async () => {
			const mockData = [
				{ id: 1n, cuid: 'abc', emp_code: 'E01', first_name: 'John', last_name: 'Doe' }
			];
			vi.mocked(employeeDao.list).mockResolvedValue(mockData as any);

			const result = await employeeService.getEmployees();

			expect(employeeDao.list).toHaveBeenCalledTimes(1);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ cuid: 'abc', emp_code: 'E01', first_name: 'John', last_name: 'Doe' });
		});
	});

	describe('getEmployeeByCuid2', () => {
		it('should throw an error if cuid is missing', async () => {
			await expect(employeeService.getEmployeeByCuid2('')).rejects.toThrow('Employee CUID2 is required');
		});

		it('should return mapped employee', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ id: 1n, cuid: 'abc', first_name: 'John' } as any);
			const result = await employeeService.getEmployeeByCuid2('abc');
			expect(result.first_name).toBe('John');
		});
	});

    describe('deleteEmployee', () => {
        it('should throw if employee missing', async () => {
            vi.mocked(employeeDao.findByCuid2).mockResolvedValue(null);
            await expect(employeeService.deleteEmployee('miss')).rejects.toThrow('Employee with CUID2 "miss" not found');
        });

        it('should call remove', async () => {
            vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ id: 1n, cuid: 'abc' } as any);
            vi.mocked(employeeDao.remove).mockResolvedValue({ id: 1n, cuid: 'abc' } as any);
            const result = await employeeService.deleteEmployee('abc');
            expect(employeeDao.remove).toHaveBeenCalledWith('abc');
            expect(result.cuid).toBe('abc');
        });
    });
});
