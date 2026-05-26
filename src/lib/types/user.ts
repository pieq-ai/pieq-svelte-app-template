export interface User {
	id: string;
	email: string;
	name: string | null;
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
