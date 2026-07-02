export interface User {
	id: string;
	email: string;
	name: string | null;
	keycloak_sub?: string;
	employee_cuid?: string;
	employment_cuid?: string;
	emp_code?: string;
	employee_name?: string;
	official_email?: string;
	system_role_cuid?: string;
	system_role_name?: string | null;
	profile_completion_status?: string;
	permissions?: string[];
	idToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface KeycloakProfile {
	id: string;
	email?: string | null;
	name?: string | null;
}

export interface DashboardContext {
	user: User;
	roles: string[];
	stats: {
		memberSince: string;
		roleCount: number;
	};
}

export type KeycloakRole = string;
