import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request, cookies }: RequestEvent) {
	if (process.env.NODE_ENV === 'production') {
		return json({ error: 'Not Found' }, { status: 404 });
	}

	const { email } = await request.json();
	if (!email) {
		return json({ error: 'Email is required' }, { status: 400 });
	}

	cookies.set('mock-user-email', email, {
		path: '/',
		httpOnly: true,
		secure: false,
		maxAge: 60 * 60 * 24 * 7 // 1 week
	});

	return json({ success: true });
}
