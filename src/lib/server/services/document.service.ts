import { ValidationError } from '$lib/server/utils/errors.js';
import * as documentDao from '$lib/server/dao/document.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as employeeLifecycleService from '$lib/server/services/employee-lifecycle.service.js';
import { z } from 'zod';
import { db } from '$lib/server/db.js';
import { auditFactory } from '$lib/server/factories/audit.factory.js';
import { documentSchema } from '$lib/schemas/employee.schema.js';

export interface UpsertDocumentDto {
    cuid?: string;
    document_type_cuid: string;
    mime_type?: string | null;
    file_name?: string | null;
    file_size?: number | string | null;
    document_base64?: string | null;
    updated_by?: string;
}

function toPublicDocument(doc: any) {
    if (!doc) return null;
    const { id, employee_cuid, created_at, updated_at, buffer, ...rest } = doc;
    // Don't send the raw binary buffer back to the client in the list
    return { ...rest, file_size: (rest.file_size !== null && rest.file_size !== undefined) ? Number(rest.file_size) : null };
}

export async function getDocumentsByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await documentDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicDocument);
}

export async function replaceDocuments(employee_cuid: string, dtos: UpsertDocumentDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    console.log('Documents Payload:', dtos);

    const schema = z.array(documentSchema)
        .refine(items => {
            const documentTypeCuids = items.map(i => i.document_type_cuid);
            return new Set(documentTypeCuids).size === documentTypeCuids.length;
        }, { message: "Duplicate document types are not allowed", path: ["root"] });
        
    const parsed = schema.safeParse(dtos);
    console.log('Zod validation result:', JSON.stringify(parsed, null, 2));

    if (!parsed.success) {
        throw parsed.error;
    }

    const validatedDtos = parsed.data;
    console.log('Parsed payload:', validatedDtos);

    const payload = validatedDtos.map((dto: any) => {
        let buffer: Buffer | null | undefined = undefined;
        if (dto.document_base64 !== undefined) {
            if (dto.document_base64) {
                // Handle data URI scheme if present e.g. data:image/png;base64,iVBOR...
                const b64Data = dto.document_base64.includes(',') ? dto.document_base64.split(',')[1] : dto.document_base64;
                buffer = Buffer.from(b64Data, 'base64');
                
                    // Magic number validation
                    if (buffer.length > 4) {
                        const magic = buffer.toString('hex', 0, 4);
                        // PDF: 25504446
                        const isPdf = magic === '25504446';
                        
                        if (!isPdf) {
                            throw new ValidationError("file", "Only PDF files are allowed");
                        }
                    }
                    if (buffer.length > 2 * 1024 * 1024) {
                        throw new ValidationError("file", "PDF file size must not exceed 2 MB.");
                    }
            } else {
                buffer = null;
            }
        }

        return {
            cuid: dto.cuid,
            document_type_cuid: dto.document_type_cuid,
            mime_type: dto.mime_type,
            file_name: dto.file_name,
            file_size: (dto.file_size !== null && dto.file_size !== undefined) ? BigInt(dto.file_size) : null,
            document: buffer,
            created_by: dto.updated_by,
            updated_by: dto.updated_by
        };
    });

    const results = await db.$transaction(async (tx) => {
        const res = (tx && Object.keys(tx).length > 0)
            ? await documentDao.replaceDocuments(employee_cuid, payload, tx)
            : await documentDao.replaceDocuments(employee_cuid, payload);
        await auditFactory.documentUploaded({
            entityCuid: employee_cuid,
            remarks: `Replaced employee documents. Count: ${res.length}.`
        }, tx);
        return res;
    });
    await employeeLifecycleService.syncEmployeeLifecycle(employee_cuid);
    return results.map(toPublicDocument);
}

export async function getDocumentByCuid(cuid: string) {
    if (!cuid) throw new Error("Document CUID2 is required");
    const doc = await documentDao.findByCuid(cuid);
    if (!doc) throw new Error(`Document with CUID2 "${cuid}" not found`);
    return doc;
}

