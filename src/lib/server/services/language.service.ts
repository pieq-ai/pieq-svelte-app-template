import { ValidationError } from '$lib/server/utils/errors.js';
import * as languageDao from '$lib/server/dao/language.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';

export interface UpsertLanguageDto {
    cuid?: string;
    language_cuid: string;
    proficiency_level?: string | null;
    can_read?: boolean | string | null;
    can_write?: boolean | string | null;
    can_speak?: boolean | string | null;
    updated_by?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicLanguage(lang: any) {
    if (!lang) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = lang;
    return rest;
}

export async function getLanguagesByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await languageDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicLanguage);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBool(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return false;
}

export async function replaceLanguages(employee_cuid: string, dtos: UpsertLanguageDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    if (!Array.isArray(dtos)) throw new ValidationError("language", "Languages must be an array");

    for (const dto of dtos) {
        if (!dto.language_cuid) throw new ValidationError("language", "Language reference is required");
    }

    const payload = dtos.map(dto => ({
        cuid: dto.cuid,
        language_cuid: dto.language_cuid,
        proficiency_level: dto.proficiency_level,
        can_read: parseBool(dto.can_read),
        can_write: parseBool(dto.can_write),
        can_speak: parseBool(dto.can_speak),
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await languageDao.replaceLanguages(employee_cuid, payload);
    await employeeService.checkAndSetProfileCompletionStatus(employee_cuid).catch(console.error);
    return results.map(toPublicLanguage);
}
