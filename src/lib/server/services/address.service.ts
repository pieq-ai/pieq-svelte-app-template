import { ValidationError } from '$lib/server/utils/errors.js';
import * as addressDao from '$lib/server/dao/address.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicAddress(addr: any) {
    if (!addr) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = addr;
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

    if (!Array.isArray(dtos)) {
        throw new ValidationError("address", "Addresses must be an array");
    }

    // Basic validation
    for (const dto of dtos) {
        if (!dto.address_line1 || !dto.city || !dto.state_cuid || !dto.country_cuid) {
            throw new ValidationError("address", "Address line 1, city, state, and country are required for all addresses");
        }
    }

    const payload = dtos.map(dto => ({
        ...dto,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await addressDao.replaceAddresses(employee_cuid, payload);
    await employeeService.checkAndSetProfileCompletionStatus(employee_cuid).catch(console.error);
    return results.map(toPublicAddress);
}
