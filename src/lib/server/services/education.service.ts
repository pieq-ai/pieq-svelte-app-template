import * as educationDao from '$lib/server/dao/education.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as employeeService from '$lib/server/services/employee.service.js';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicEducation(edu: any) {
    if (!edu) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, percentage, ...rest } = edu;
    return { ...rest, percentage: percentage ? Number(percentage) : null };
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

    if (!Array.isArray(dtos)) throw new Error("Educations must be an array");

    for (const dto of dtos) {
        if (!dto.education_level) throw new Error("Education level is required");
    }

    const payload = dtos.map(dto => {
        const completed_at = dto.completed_at ? new Date(dto.completed_at) : null;
        if (completed_at && completed_at > new Date()) {
            throw new Error("Education completion date cannot be in the future");
        }

        return {
            cuid: dto.cuid,
            education_level: dto.education_level,
            specialization: dto.specialization,
            institution: dto.institution,
            university_board: dto.university_board,
            percentage: dto.percentage ? Number(dto.percentage) : null,
            completed_at,
            created_by: dto.updated_by,
            updated_by: dto.updated_by
        };
    });

    const results = await educationDao.replaceEducations(employee_cuid, payload);
    await employeeService.checkAndSetProfileCompletionStatus(employee_cuid).catch(console.error);
    return results.map(toPublicEducation);
}
