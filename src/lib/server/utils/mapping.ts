/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapToApi(entity: any): any {
	if (Array.isArray(entity)) return entity.map(mapToApi);
	if (entity === null || typeof entity !== 'object' || entity instanceof Date) return entity;

	const mapped: any = {};
	for (const [key, value] of Object.entries(entity)) {
		if (key.endsWith('cuid')) {
			const newKey = key.replace(/cuid$/, 'cuid');
			mapped[newKey] = mapToApi(value);
		} else {
			mapped[key] = mapToApi(value);
		}
	}
	return mapped;
}

export function mapToDb(payload: any): any {
	if (Array.isArray(payload)) return payload.map(mapToDb);
	if (payload === null || typeof payload !== 'object' || payload instanceof Date) return payload;

	const mapped: any = {};
	for (const [key, value] of Object.entries(payload)) {
		if (key.endsWith('cuid')) {
			const newKey = key.replace(/cuid$/, 'cuid');
			mapped[newKey] = mapToDb(value);
		} else {
			mapped[key] = mapToDb(value);
		}
	}
	return mapped;
}

export function toDepartmentDTO(department: any) {
	if (!department) return department;
	return {
		cuid: department.cuid,
		dept_name: department.dept_name,
		status: department.status,
		updated_at: department.updated_at
	};
}

export function toDesignationDTO(designation: any) {
	if (!designation) return designation;
	return {
		cuid: designation.cuid,
		designation_name: designation.designation_name,
		status: designation.status,
		updated_at: designation.updated_at
	};
}

export function toEmployeeDTO(employee: any) {
	if (!employee) return employee;
	return {
		cuid: employee.cuid,
		name: employee.name,
		age: employee.age
	};
}

export function toPermissionDTO(permission: any) {
	if (!permission) return permission;
	return {
		cuid: permission.cuid,
		permission_key: permission.permission_key,
		status: permission.status,
		updated_at: permission.updated_at
	};
}

export function toSystemRoleDTO(systemRole: any) {
	if (!systemRole) return systemRole;
	return {
		cuid: systemRole.cuid,
		system_role_name: systemRole.system_role_name,
		status: systemRole.status,
		updated_at: systemRole.updated_at
	};
}

export function toRolePermissionDTO(mapping: any) {
	if (!mapping) return mapping;
	return {
		cuid: mapping.cuid,
		system_role_cuid: mapping.system_role_cuid,
		permission_cuid: mapping.permission_cuid,
		updated_at: mapping.updated_at
	};
}

export function toMasterDataDTO(masterData: any) {
	if (!masterData) return masterData;
	return {
		id: masterData.id,
		label: masterData.label,
		master: masterData.master,
		meta: masterData.meta,
		updated_at: masterData.updated_at
	};
}
