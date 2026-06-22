import { db } from '$lib/server/db.js';

export interface UpsertAddressInput {
    cuid?: string;
    address_type: string;
    door_no?: string | null;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state_cuid: string;
    country_cuid: string;
    pin_code?: string | null;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string) {
    return db.address.findMany({
        where: { employee_cuid },
        orderBy: { created_at: 'asc' }
    });
}

export async function replaceAddresses(employee_cuid: string, addresses: UpsertAddressInput[]) {
    return db.$transaction(async (tx) => {
        const providedCuids = addresses.map(a => a.cuid).filter(c => c) as string[];
        
        await tx.address.deleteMany({
            where: {
                employee_cuid,
                cuid: { notIn: providedCuids }
            }
        });

        const results = [];
        for (const addr of addresses) {
            if (addr.cuid) {
                results.push(await tx.address.update({
                    where: { cuid: addr.cuid },
                    data: {
                        address_type: addr.address_type,
                        door_no: addr.door_no,
                        address_line1: addr.address_line1,
                        address_line2: addr.address_line2,
                        city: addr.city,
                        state_cuid: addr.state_cuid,
                        country_cuid: addr.country_cuid,
                        pin_code: addr.pin_code,
                        updated_by: addr.updated_by
                    }
                }));
            } else {
                results.push(await tx.address.create({
                    data: {
                        employee_cuid,
                        address_type: addr.address_type,
                        door_no: addr.door_no,
                        address_line1: addr.address_line1,
                        address_line2: addr.address_line2,
                        city: addr.city,
                        state_cuid: addr.state_cuid,
                        country_cuid: addr.country_cuid,
                        pin_code: addr.pin_code,
                        created_by: addr.created_by,
                        updated_by: addr.updated_by
                    }
                }));
            }
        }
        return results;
    });
}
