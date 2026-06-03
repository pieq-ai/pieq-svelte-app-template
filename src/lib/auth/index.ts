import { signIn, signOut as authSignOut } from '@auth/sveltekit/client';
import { clearStoredOidcUser } from './token-storage';

export { signIn } from '@auth/sveltekit/client';
export {
	clearOidcUser,
	clearStoredOidcUser,
	getAccessToken,
	getOidcUser,
	storeOidcUser
} from './token-storage';

export function signInWithKeycloak(redirectTo = '/dashboard') {
	return signIn('keycloak', { redirectTo });
}

export async function signOut(options?: Parameters<typeof authSignOut>[0]) {
	clearStoredOidcUser();
	return authSignOut(options);
}
