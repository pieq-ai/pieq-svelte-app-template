import { db } from '$lib/server/db.js';

export interface UpsertDocumentInput {
    cuid?: string;
    document_type_cuid: string;
    mime_type?: string | null;
    file_name?: string | null;
    file_size?: number | bigint | null;
    document?: Buffer | null;
    created_by?: string;
    updated_by?: string;
}

export async function findByEmployeeCuid(employee_cuid: string) {
    return db.employeeDocument.findMany({
        where: { employee_cuid },
        orderBy: { created_at: 'asc' }
    });
}

export async function replaceDocuments(employee_cuid: string, documents: UpsertDocumentInput[], tx?: any) {
    const run = async (t: any) => {
        const providedCuids = documents.map(d => d.cuid).filter(c => c) as string[];
        
        await t.employeeDocument.deleteMany({
            where: {
                employee_cuid,
                cuid: { notIn: providedCuids }
            }
        });

        const results = [];
        for (const doc of documents) {
            if (doc.cuid) {
                const data: any = {
                    document_type_cuid: doc.document_type_cuid,
                    mime_type: doc.mime_type,
                    file_name: doc.file_name,
                    file_size: doc.file_size,
                    updated_by: doc.updated_by
                };
                if (doc.document !== undefined) {
                    data.document = doc.document ? new Uint8Array(doc.document) : null;
                }
                results.push(await t.employeeDocument.update({
                    where: { cuid: doc.cuid },
                    data
                }));
            } else {
                results.push(await t.employeeDocument.create({
                    data: {
                        employee_cuid,
                        document_type_cuid: doc.document_type_cuid,
                        mime_type: doc.mime_type,
                        file_name: doc.file_name,
                        file_size: doc.file_size,
                        document: doc.document ? new Uint8Array(doc.document) : null,
                        created_by: doc.created_by,
                        updated_by: doc.updated_by
                    }
                }));
            }
        }
        return results;
    };

    if (tx) {
        return run(tx);
    } else {
        return db.$transaction(run);
    }
}

export async function findByCuid(cuid: string) {
    return db.employeeDocument.findUnique({
        where: { cuid }
    });
}

