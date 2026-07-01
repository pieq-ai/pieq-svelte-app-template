import { SYSTEM_ROLES } from '$lib/constants/roles';

export type AuthzUser = {
    system_role_cuid?: string;
    system_role_name?: string | null;
    [key: string]: any; // Allow other properties for flexibility
};

/**
 * STRICTLY evaluates if the user holds a specific System Role.
 * Uses immutable CUIDs for stability.
 */
export function hasRole(user: AuthzUser | null | undefined, allowedRoleCuids: string[]): boolean {
    if (!user || !user.system_role_cuid) return false;
    return allowedRoleCuids.includes(user.system_role_cuid);
}

/**
 * Temporary mapping of permissions/actions to System Role CUIDs.
 * This ensures callers use permission strings (e.g. "employee:view") today,
 * even though we are still evaluating roles under the hood.
 * 
 * TODO: Replace this hardcoded mapping with a real permission model or OPA later.
 */
const PERMISSION_TO_ROLE_MAP: Record<string, string[]> = {
    'dashboard:view': [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EMPLOYEE],
    'dashboard:admin': [SYSTEM_ROLES.ADMIN],
    
    // Core HR
    'employee:view': [SYSTEM_ROLES.ADMIN],
    'department:view': [SYSTEM_ROLES.ADMIN],
    'designation:view': [SYSTEM_ROLES.ADMIN],
    'role:view': [SYSTEM_ROLES.ADMIN],
    
    // Leave Management
    'leave:view': [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EMPLOYEE],
    'leave_type:view': [SYSTEM_ROLES.ADMIN],
    'leave_policy:view': [SYSTEM_ROLES.ADMIN],
    'holiday:view': [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EMPLOYEE],
    
    // Attendance
    'location:view': [SYSTEM_ROLES.ADMIN],
    'attendance:view': [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EMPLOYEE],
    'attendance_record:view': [SYSTEM_ROLES.ADMIN],
    
    // Shifts
    'shift:view': [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EMPLOYEE],
    'shift_assignment:view': [SYSTEM_ROLES.ADMIN],
    
    // Salary
    'salary_component:view': [SYSTEM_ROLES.ADMIN],
    'salary_structure:view': [SYSTEM_ROLES.ADMIN],
    'payroll:view': [SYSTEM_ROLES.ADMIN],
    
    // System Config
    'system_role:view': [SYSTEM_ROLES.ADMIN],
    'permission:view': [SYSTEM_ROLES.ADMIN],
    'role_permission:view': [SYSTEM_ROLES.ADMIN]
};

/**
 * Single source of truth for all access checks.
 * Consumed by UI, Layouts, Server Guards, and API Endpoints.
 * 
 * Conceptually operates on permissions/actions rather than roles.
 * Currently delegates to hasRole() internally by resolving the required roles.
 */
export function canAccess(user: AuthzUser | null | undefined, permission: string): boolean {
    const requiredRoleCuids = PERMISSION_TO_ROLE_MAP[permission] || [];
    const result = hasRole(user, requiredRoleCuids);
    console.log("[AUTHZ DIAGNOSTIC]", {
        currentUser: user?.email || user?.id || "Unknown",
        system_role_cuid: user?.system_role_cuid,
        system_role_name: user?.system_role_name,
        permission,
        allowedRoles: requiredRoleCuids,
        finalResult: result
    });
    return result;
}
