export const EMPLOYEE_API_CONTEXT = Symbol('EMPLOYEE_API_CONTEXT');

export interface EmployeeApiClient {
    mode: 'create' | 'edit' | 'self';
    getBaseUrl(module?: string): string;
}
