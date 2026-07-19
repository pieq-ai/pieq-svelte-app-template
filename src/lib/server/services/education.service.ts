import { ValidationError } from '$lib/server/utils/errors.js';
import * as educationDao from '$lib/server/dao/education.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';
import * as employeeLifecycleService from '$lib/server/services/employee-lifecycle.service.js';
import * as auditService from '$lib/server/services/audit.service.js';
import { z } from 'zod';
import { educationSchema } from '$lib/schemas/employee.schema.js';

export interface UpsertEducationDto {
    cuid?: string;
    education_level: string;
    specialization?: string | null;
    institution?: string | null;
    university_board?: string | null;
    percentage?: number | string | null;
    completed_at?: string | Date | null;
    updated_by?: string;
}

function toPublicEducation(edu: any) {
    if (!edu) return null;
    const { id, employee_cuid, created_at, updated_at, percentage, ...rest } = edu;
    return { ...rest, percentage: (percentage !== null && percentage !== undefined) ? Number(percentage) : null };
}

export async function getEducationsByEmployeeCuid(employee_cuid: string) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const records = await educationDao.findByEmployeeCuid(employee_cuid);
    return records.map(toPublicEducation);
}

export async function replaceEducations(employee_cuid: string, dtos: UpsertEducationDto[]) {
    if (!employee_cuid) throw new Error("Employee CUID2 is required");
    const employee = await employeeDao.findByCuid2(employee_cuid);
    if (!employee) throw new Error(`Employee with CUID2 "${employee_cuid}" not found`);

    const oldRecords = await educationDao.findByEmployeeCuid(employee_cuid);
    const oldEducationDTOs = oldRecords.map(toPublicEducation);

    const validatedDtos = z.array(educationSchema)
        .refine(items => {
            const keys = items.map(i => `${i.education_level}|${i.specialization}|${i.institution}`);
            return new Set(keys).size === keys.length;
        }, { message: "Duplicate education entries are not allowed", path: ["root"] })
        .parse(dtos);

    const payload = validatedDtos.map((dto: any) => ({
        cuid: dto.cuid,
        education_level: dto.education_level,
        specialization: dto.specialization,
        institution: dto.institution,
        university_board: dto.university_board,
        percentage: (dto.percentage !== null && dto.percentage !== undefined) ? Number(dto.percentage) : null,
        completed_at: dto.completed_at,
        created_by: dto.updated_by,
        updated_by: dto.updated_by
    }));

    const results = await educationDao.replaceEducations(employee_cuid, payload);
    const newEducationDTOs = results.map(toPublicEducation);

    await auditService.logListUpdate({
        entityName: 'Employee',
        entityCuid: employee_cuid,
        category: 'educations',
        oldList: oldEducationDTOs,
        newList: newEducationDTOs,
        getItemLabel: (item) => item.education_level,
        remarks: 'Employee education history updated.'
    });
    await employeeLifecycleService.syncEmployeeLifecycle(employee_cuid);
    return newEducationDTOs;
}
