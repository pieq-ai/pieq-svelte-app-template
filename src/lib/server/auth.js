import { SvelteKitAuth } from '@auth/sveltekit';
import { appendFileSync } from 'fs';
import Keycloak from '@auth/sveltekit/providers/keycloak';
import { getAuthConfig } from '$lib/server/config.js';
import * as authUserService from '$lib/server/services/auth-user.service.js';
import { getPermissionKeysForRole } from '$lib/server/services/role-permission.service.js';

/** @param {Record<string, unknown> | undefined} profile */
function buildOidcProfile(profile) {
	if (!profile) {
		return { sub: '' };
	}

	return {
		sub: /** @type {string} */ (profile.sub ?? ''),
		iss: /** @type {string | undefined} */ (profile.iss),
		aud: /** @type {string | undefined} */ (profile.aud),
		exp: /** @type {number | undefined} */ (profile.exp),
		iat: /** @type {number | undefined} */ (profile.iat),
		email: /** @type {string | undefined} */ (profile.email),
		email_verified: /** @type {boolean | undefined} */ (profile.email_verified),
		name: /** @type {string | undefined} */ (profile.name),
		preferred_username: /** @type {string | undefined} */ (profile.preferred_username),
		given_name: /** @type {string | undefined} */ (profile.given_name),
		family_name: /** @type {string | undefined} */ (profile.family_name),
		sid: /** @type {string | undefined} */ (profile.sid),
		typ: /** @type {string | undefined} */ (profile.typ),
		user_created_at: /** @type {string | undefined} */ (profile.user_created_at)
	};
}

function createAuth() {
	const { clientId, clientSecret, issuer } = getAuthConfig();

	return SvelteKitAuth({
		providers: [
			Keycloak({
				clientId,
				clientSecret,
				issuer
			})
		],
		callbacks: {
			async jwt({ token, account, profile }) {
				if (account && profile) {
					token.sub = /** @type {string} */ (profile.sub); // Force update to new Keycloak UUID if it changed
					const oidcProfile = buildOidcProfile(/** @type {Record<string, unknown>} */ (profile));

					token.oidcUser = {
						access_token: account.access_token ?? '',
						refresh_token: account.refresh_token ?? '',
						id_token: account.id_token ?? '',
						expires_at: account.expires_at ?? 0,
						scope: account.scope ?? '',
						session_state: account.session_state ?? oidcProfile.sid ?? '',
						token_type: account.token_type ?? 'Bearer',
						profile: oidcProfile
					};

					// Load HRMS context and permissions during the login phase (once)
					try {
						const hrmsContext = await authUserService.syncAuthenticatedUser(token.sub, profile.email ?? undefined);
						token.hrmsContext = hrmsContext;

						if (hrmsContext?.system_role_cuid) {
							let permissions = [];
							if (hrmsContext.system_role_cuid === 'bootstrap-role-cuid') {
								// During uninitialized bootstrap, give full wildcard access
								permissions = ['*']; 
							} else {
								permissions = await getPermissionKeysForRole(hrmsContext.system_role_cuid);
							}
							token.permissions = permissions;
						}
					} catch (err) {
						console.error('[AUTH.JS] Error syncing HRMS context during login', err);
						token.hrmsContext = null;
						token.permissions = [];
					}
				}

				if (profile) {
					const realmAccess = /** @type {{ roles?: string[] } | undefined} */ (
						profile.realm_access
					);
					token.roles = realmAccess?.roles ?? [];
				}
				
				return token;
			},
			async session({ session, token }) {
				if (session.user && token.sub) {
					session.user.id = token.sub;
				}

				session.roles = /** @type {string[]} */ (token.roles ?? []);
				session.permissions = /** @type {string[]} */ (token.permissions ?? []);
				
				if (token.hrmsContext) {
					session.hrmsContext = /** @type {import('$lib/server/services/auth-user.service').AuthContext} */ (token.hrmsContext);
				}

				if (token.oidcUser) {
					session.oidcUser = /** @type {import('$lib/types/oidc').OidcUserStorage} */ (
						token.oidcUser
					);
				}
				
				return session;
			}
		},
		pages: {
			signIn: '/'
		},
		trustHost: true
	});
}

const auth = createAuth();

export const handle = auth.handle;
export const signIn = auth.signIn;
export const signOut = auth.signOut;
