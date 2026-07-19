import { ValidationError } from '$lib/server/utils/errors.js';
import * as addressDao from '$lib/server/dao/address.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as employeeLifecycleService from '$lib/server/services/employee-lifecycle.service.js';
import * as auditService from '$lib/server/services/audit.service.js';
import { z } from 'zod';
import { addressSchema } from '$lib/schemas/employee.schema.js';

export interface UpsertAddressDto {
    cuid?: string;
    address_type: string;
    door_no?: string | null;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state_cuid: string;
    country_cuid: string;
    pin_code?: string | null;
    updated_by?: string;
}

function toPublicAddress(address: any) {
    if (!address) return null;
    const { id, employee_cuid, created_at, updated_at, ...rest } = address;
    return rest;
}

export async function getAddressesByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await addressDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicAddress);
}

export async function replaceAddresses(employee_cuid: string, dtos: UpsertAddressDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    const oldRecords = await addressDao.findByEmployeeCuid(employee_cuid);
    const oldAddressDTOs = oldRecords.map(toPublicAddress);

    const validatedDtos = z.array(addressSchema).parse(dtos);

    const payload = validatedDtos.map((dto: any) => ({
        ...dto,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await addressDao.replaceAddresses(employee_cuid, payload);
    const newAddressDTOs = results.map(toPublicAddress);

    await auditService.logListUpdate({
        entityName: 'Employee',
        entityCuid: employee_cuid,
        category: 'addresses',
        oldList: oldAddressDTOs,
        newList: newAddressDTOs,
        getItemLabel: (item) => item.address_type,
        remarks: 'Employee addresses updated.'
    });
    await employeeLifecycleService.syncEmployeeLifecycle(employee_cuid);
    return newAddressDTOs;
}
