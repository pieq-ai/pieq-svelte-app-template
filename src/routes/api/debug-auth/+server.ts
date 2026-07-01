import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
    const session = await locals.auth();
    return json({
        localsUser: locals.user,
        sessionUser: session?.user,
        roles: locals.roles
    });
}
