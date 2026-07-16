import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAppConfig } from '$lib/server/config.js';

export const GET: RequestHandler = async (event) => {
    const idToken = event.url.searchParams.get('id_token_hint');

    const appConfig = getAppConfig();
    const appUrl = appConfig.appUrl;

    if (appConfig.oidc.issuer) {
        // Redirect to Keycloak end_session_endpoint
        const logoutUrl = new URL(`${appConfig.oidc.issuer}/protocol/openid-connect/logout`);
        logoutUrl.searchParams.append('client_id', appConfig.oidc.clientId);
        logoutUrl.searchParams.append('post_logout_redirect_uri', appUrl);
        if (idToken) {
            logoutUrl.searchParams.append('id_token_hint', idToken);
        }

        throw redirect(303, logoutUrl.toString());
    }

    throw redirect(303, '/');
};
