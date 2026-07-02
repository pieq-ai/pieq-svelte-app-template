import type { AppConfig } from '$lib/types/config';
import type { OidcUserStorage } from '$lib/types/oidc';
import type { User } from '$lib/types/user';
import type { Session } from '@auth/core/types';

declare global {
	namespace App {
		interface Locals {
			auth: () => Promise<Session | null>;
			user: User | null;
			roles: string[];
			session?: Session | null;
		}

		interface PageData {
			session?: Session | null;
			user?: User | null;
			roles?: string[];
			config?: AppConfig;
		}
	}

	interface Window {
		__PIEQ_CONFIG__?: AppConfig;
	}

	interface BigInt {
		toJSON(): string;
	}

	var __db: import('$lib/generated/prisma/client').PrismaClient | undefined;
	var __dbSchemaVersion: string | undefined;
}

declare module '@auth/core/types' {
	interface Session {
		roles?: string[];
		permissions?: string[];
		hrmsContext?: import('$lib/server/services/auth-user.service').AuthContext | null;
		oidcUser?: OidcUserStorage;
	}

	interface JWT {
		roles?: string[];
		permissions?: string[];
		hrmsContext?: import('$lib/server/services/auth-user.service').AuthContext | null;
		oidcUser?: OidcUserStorage;
	}
}

declare module '*.svelte' {
	import type { Component } from 'svelte';
	const component: Component;
	export default component;
}

export {};
