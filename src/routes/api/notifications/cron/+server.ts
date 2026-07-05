import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { processDailyNotifications } from '$lib/server/services/scheduled-jobs.js';

// Simple shared secret config check
const CRON_SECRET = process.env.CRON_SECRET || 'PIEQ_HRMS_CRON_SECRET_2026';

export async function GET(event: RequestEvent) {
	return handleCron(event);
}

export async function POST(event: RequestEvent) {
	return handleCron(event);
}

async function handleCron(event: RequestEvent) {
	try {
		const isDev = process.env.NODE_ENV !== 'production';
		const incomingSecret = event.request.headers.get('X-Cron-Secret') || 
							  event.url.searchParams.get('secret') || '';

		if (!isDev && incomingSecret !== CRON_SECRET) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		await processDailyNotifications();

		return json({
			data: {
				success: true,
				message: 'Daily notifications processed successfully'
			}
		});
	} catch (error) {
		const message = (error as Error).message;
		return json({ error: message }, { status: 500 });
	}
}
