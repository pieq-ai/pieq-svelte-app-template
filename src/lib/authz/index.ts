export type AuthzUser = {
    system_role_cuid?: string;
    system_role_name?: string | null;
    permissions?: string[];
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
 * Single source of truth for all access checks.
 * Consumed by UI, Layouts, Server Guards, and API Endpoints.
 * 
 * Evaluates dynamically loaded permissions assigned to the user's role.
 */
export function canAccess(user: AuthzUser | null | undefined, permission: string): boolean {
    if (!user) {
        return false;
    }

    // Built-in permissions for any authenticated user
    const defaultPermissions = ['profile:view'];
    if (defaultPermissions.includes(permission)) {
        return true;
    }

    if (!Array.isArray(user.permissions)) {
        return false;
    }

    // Support wildcard permission for bootstrap admin
    const result = user.permissions.includes('*') || user.permissions.includes(permission);
    
    console.log("[AUTHZ DIAGNOSTIC]", {
        currentUser: user?.email || user?.id || "Unknown",
        system_role_cuid: user?.system_role_cuid,
        system_role_name: user?.system_role_name,
        permission,
        finalResult: result
    });
    
    return result;
}
