import { json } from '@sveltejs/kit';
import { ValidationError } from '$lib/server/utils/errors.js';

export function sendList(data: unknown) {
	return json({ data });
}

export function sendItem(data: unknown) {
	return json({ data });
}

export function sendCreated(cuid: string, message: string = 'Successfully created') {
	return json({ data: { cuid, message } }, { status: 201 });
}

export function sendUpdated(cuid: string, message: string = 'Successfully updated') {
	return json({ data: { cuid, message } });
}

export function sendDeleted(cuid: string, message: string = 'Successfully deleted') {
	return json({ data: { cuid, message } });
}

export function handleError(error: unknown) {
	if (error instanceof ValidationError) {
		return json(
			{ data: { success: false, field: error.field, message: error.message } },
			{ status: 409 }
		);
	}
	const message = (error as Error).message;
	const status = message === 'Unauthorized' ? 401 : message.includes('not found') ? 404 : 400;
	return json({ error: message }, { status });
}
