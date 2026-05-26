/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error, event }) {
	console.error('[client]', event.url.pathname, error);
}
