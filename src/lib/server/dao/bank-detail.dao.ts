import { db } from '$lib/server/db.js';

export interface UpsertBankDetailInput {
    cuid?: string;
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    branch_name?: string | null;
    ifsc_code: string;
    is_primary?: boolean;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string) {
    return db.bankDetail.findMany({
        where: { employee_cuid },
        orderBy: { created_at: 'asc' }
    });
}

export async function replaceBankDetails(employee_cuid: string, bankDetails: UpsertBankDetailInput[]) {
    return db.$transaction(async (tx) => {
        const providedCuids = bankDetails.map(b => b.cuid).filter(c => c) as string[];
        
        await tx.bankDetail.deleteMany({
            where: {
                employee_cuid,
                cuid: { notIn: providedCuids }
            }
        });

        const results = [];
        for (const bank of bankDetails) {
            if (bank.cuid) {
                results.push(await tx.bankDetail.update({
                    where: { cuid: bank.cuid },
                    data: {
                        account_holder_name: bank.account_holder_name,
                        account_number: bank.account_number,
                        bank_name: bank.bank_name,
                        branch_name: bank.branch_name,
                        ifsc_code: bank.ifsc_code,
                        is_primary: bank.is_primary ?? false,
                        updated_by: bank.updated_by
                    }
                }));
            } else {
                results.push(await tx.bankDetail.create({
                    data: {
                        employee_cuid,
                        account_holder_name: bank.account_holder_name,
                        account_number: bank.account_number,
                        bank_name: bank.bank_name,
                        branch_name: bank.branch_name,
                        ifsc_code: bank.ifsc_code,
                        is_primary: bank.is_primary ?? false,
                        created_by: bank.created_by,
                        updated_by: bank.updated_by
                    }
                }));
            }
        }
        return results;
    });
}
