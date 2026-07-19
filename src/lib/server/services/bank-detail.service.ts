import * as bankDetailDao from '$lib/server/dao/bank-detail.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as employeeLifecycleService from '$lib/server/services/employee-lifecycle.service.js';
import * as auditService from '$lib/server/services/audit.service.js';
import { z } from 'zod';
import { bankDetailSchema } from '$lib/schemas/employee.schema.js';

export interface UpsertBankDetailDto {
    cuid?: string;
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    branch_name?: string | null;
    ifsc_code: string;
    is_primary?: boolean | string | null;
    updated_by?: string;
}

function toPublicBankDetail(bank: any) {
    if (!bank) return null;
    const { id, employee_cuid, created_at, updated_at, ...rest } = bank;
    return rest;
}

export async function getBankDetailsByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await bankDetailDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicBankDetail);
}

function parseBool(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return false;
}

export async function replaceBankDetails(employee_cuid: string, dtos: UpsertBankDetailDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    const validatedDtos = z.array(bankDetailSchema)
        .refine(items => {
            const accountNumbers = items.map(i => i.account_number);
            return new Set(accountNumbers).size === accountNumbers.length;
        }, { message: "Duplicate account numbers are not allowed", path: ["root"] })
        .refine(items => {
            return items.filter(i => parseBool(i.is_primary)).length <= 1;
        }, { message: "Only one bank account can be marked as primary", path: ["root"] })
        .parse(dtos);

    const payload = validatedDtos.map((dto: any) => ({
        cuid: dto.cuid,
        account_holder_name: dto.account_holder_name,
        account_number: dto.account_number,
        bank_name: dto.bank_name,
        branch_name: dto.branch_name,
        ifsc_code: dto.ifsc_code,
        is_primary: dto.is_primary,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await bankDetailDao.replaceBankDetails(employee_cuid, payload);
    await auditService.log({
        entity_name: 'Employee',
        entity_cuid: employee_cuid,
        action_type: 'update',
        status: 'SUCCESS',
        remarks: 'Employee bank details updated.'
    });
    await employeeLifecycleService.syncEmployeeLifecycle(employee_cuid);
    return results.map(toPublicBankDetail);
}
