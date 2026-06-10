import * as bankDetailDao from '$lib/server/dao/bank-detail.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicBankDetail(bank: any) {
    if (!bank) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = bank;
    return rest;
}

export async function getBankDetailsByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await bankDetailDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicBankDetail);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBool(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return false;
}

export async function replaceBankDetails(employee_cuid: string, dtos: UpsertBankDetailDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    if (!Array.isArray(dtos)) throw new Error("Bank details must be an array");

    for (const dto of dtos) {
        if (!dto.account_holder_name || !dto.account_number || !dto.bank_name || !dto.ifsc_code) {
            throw new Error("Account holder name, account number, bank name, and IFSC code are required");
        }
    }

    const payload = dtos.map(dto => ({
        cuid: dto.cuid,
        account_holder_name: dto.account_holder_name,
        account_number: dto.account_number,
        bank_name: dto.bank_name,
        branch_name: dto.branch_name,
        ifsc_code: dto.ifsc_code,
        is_primary: parseBool(dto.is_primary),
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await bankDetailDao.replaceBankDetails(employee_cuid, payload);
    return results.map(toPublicBankDetail);
}
