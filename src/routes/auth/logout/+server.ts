import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAppConfig } from '$lib/server/config.js';

export const GET: RequestHandler = async (event) => {
    const session = await event.locals.auth();
    const idToken = session?.oidcUser?.id_token;

    // Delete the Auth.js cookies to clear the local session
    event.cookies.delete('authjs.session-token', { path: '/' });
    event.cookies.delete('__Secure-authjs.session-token', { path: '/' });
    event.cookies.delete('authjs.callback-url', { path: '/' });
    event.cookies.delete('authjs.csrf-token', { path: '/' });
    event.cookies.delete('__Host-authjs.csrf-token', { path: '/' });

    const appConfig = getAppConfig();
    const appUrl = appConfig.appUrl;

    if (idToken && appConfig.oidc.issuer) {
        // Redirect to Keycloak end_session_endpoint
        const logoutUrl = new URL(`${appConfig.oidc.issuer}/protocol/openid-connect/logout`);
        logoutUrl.searchParams.append('post_logout_redirect_uri', appUrl);
        logoutUrl.searchParams.append('id_token_hint', idToken);

        throw redirect(303, logoutUrl.toString());
    }

    throw redirect(303, '/');
};
