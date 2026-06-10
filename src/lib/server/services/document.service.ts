import * as documentDao from '$lib/server/dao/document.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';

export interface UpsertDocumentDto {
    cuid?: string;
    document_type_cuid: string;
    mime_type?: string | null;
    file_name?: string | null;
    file_size?: number | string | null;
    document_base64?: string | null;
    updated_by?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicDocument(doc: any) {
    if (!doc) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, document, file_size, ...rest } = doc;
    // Don't send the raw binary buffer back to the client in the list
    return { ...rest, file_size: file_size ? Number(file_size) : null };
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

    if (!Array.isArray(dtos)) throw new Error("Documents must be an array");

    for (const dto of dtos) {
        if (!dto.document_type_cuid) throw new Error("Document type reference is required");
    }

    const payload = dtos.map(dto => {
        let buffer: Buffer | null | undefined = undefined;
        if (dto.document_base64 !== undefined) {
            if (dto.document_base64) {
                // Handle data URI scheme if present e.g. data:image/png;base64,iVBOR...
                const b64Data = dto.document_base64.includes(',') ? dto.document_base64.split(',')[1] : dto.document_base64;
                buffer = Buffer.from(b64Data, 'base64');
            } else {
                buffer = null;
            }
        }

        return {
            cuid: dto.cuid,
            document_type_cuid: dto.document_type_cuid,
            mime_type: dto.mime_type,
            file_name: dto.file_name,
            file_size: dto.file_size ? BigInt(dto.file_size) : null,
            document: buffer,
            created_by: dto.updated_by,
            updated_by: dto.updated_by
        };
    });

    const results = await documentDao.replaceDocuments(employee_cuid, payload);
    return results.map(toPublicDocument);
}
