export const HR_CONTROLLED_FIELDS = [
    'emp_code',
    'department_cuid',
    'designation_cuid',
    'role_cuid',
    'reporting_manager_cuid',
    'employment_status',
    'pay_grade_cuid',
    'employment_type_cuid',
    'location_cuid',
    'system_role_cuid',
    'date_of_joining',
    'confirmation_date',
    'relieving_date',
    'official_email',
    'aadhar_no',
    'pan_no',
    'uan_no',
    'bank_details'
];

export function isFieldEditable(mode: 'create' | 'edit' | 'self', fieldName: string): boolean {
    if (mode === 'self') {
        return !HR_CONTROLLED_FIELDS.includes(fieldName);
    }
    return true; // Admin/HR modes allow editing everything
}

export function extractEditableFields(mode: 'create' | 'edit' | 'self', payload: Record<string, any>, moduleName: string): Record<string, any> {
    if (mode !== 'self') {
        return payload;
    }

    const filtered: Record<string, any> = {};
    for (const key in payload) {
        if (isFieldEditable('self', key)) {
            filtered[key] = payload[key];
        }
    }
    return filtered;
}
