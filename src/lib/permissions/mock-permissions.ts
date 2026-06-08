export interface MasterPermissionConfig {
	canCreate: boolean;
	canEdit: boolean;
	canDelete: boolean;
	canManageMaster: boolean;
}

export const defaultMasterPermissions: MasterPermissionConfig = {
	canCreate: true,
	canEdit: true,
	canDelete: true,
	canManageMaster: true
};

export function getMasterPermissions(): MasterPermissionConfig {
	return defaultMasterPermissions;
}
