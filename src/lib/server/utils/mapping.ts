export function serialize(obj: any, stripId = true): any {
	if (Array.isArray(obj)) return obj.map((v) => serialize(v, stripId));
	if (typeof obj === 'bigint') return obj.toString();
	if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;

	const mapped: any = {};
	for (const [key, value] of Object.entries(obj)) {
		if (stripId && key === 'id') continue;
		mapped[key] = serialize(value, stripId);
	}
	return mapped;
}

export function mapToApi(entity: any): any {
	if (Array.isArray(entity)) return entity.map(mapToApi);
	if (typeof entity === 'bigint') return entity.toString();
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
	return serialize({
		cuid: department.cuid,
		name: department.name,
		status: department.status
	});
}

export function toDesignationDTO(designation: any) {
	if (!designation) return designation;
	return serialize({
		cuid: designation.cuid,
		name: designation.name,
		status: designation.status
	});
}

export function toEmployeeDTO(employee: any) {
	if (!employee) return employee;
	return serialize(employee, true);
}

export function toEmployeeAttendanceViewDTO(employee: any) {
	if (!employee) return employee;
	return serialize({
		cuid: employee.cuid,
		emp_code: employee.emp_code,
		first_name: employee.first_name,
		last_name: employee.last_name,
		date_of_joining: employee.date_of_joining || null,
		relieving_date: employee.relieving_date || null,
		location_cuid: employee.location_cuid || null,
		latitude: employee.latitude !== undefined && employee.latitude !== null ? Number(employee.latitude) : null,
		longitude: employee.longitude !== undefined && employee.longitude !== null ? Number(employee.longitude) : null
	});
}

export function toPermissionDTO(permission: any) {
	if (!permission) return permission;
	return serialize({
		cuid: permission.cuid,
		permission_key: permission.permission_key,
		status: permission.status
	});
}

export function toSystemRoleDTO(systemRole: any) {
	if (!systemRole) return systemRole;
	return serialize({
		cuid: systemRole.cuid,
		name: systemRole.name,
		status: systemRole.status
	});
}

export function toRolePermissionDTO(mapping: any) {
	if (!mapping) return mapping;
	return serialize({
		cuid: mapping.cuid,
		system_role_cuid: mapping.system_role_cuid,
		permission_cuid: mapping.permission_cuid
	});
}

export function toMasterDataDTO(masterData: any) {
	if (!masterData) return masterData;
	return serialize({
		id: masterData.id,
		label: masterData.label,
		master: masterData.master,
		meta: masterData.meta
	}, false);
}
