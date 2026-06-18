import { json } from '@sveltejs/kit';
import { ValidationError } from '$lib/server/utils/errors.js';
import { z } from 'zod';

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
	console.error('API Error:', error);
	console.error('API Error Stringified:', JSON.stringify(error, null, 2));

	if (error instanceof ValidationError) {
		return json(
			{ data: { success: false, field: error.field, message: error.message, error: error.message } },
			{ status: 409 }
		);
	}
	
	if (error instanceof z.ZodError) {
		const issues = error.issues || (error as any).errors || [];
		const firstError = issues[0];
		
		if (firstError) {
			const path = Array.isArray(firstError.path) ? firstError.path.join('.') : 'unknown_field';
			return json(
				{ data: { success: false, field: path, message: firstError.message, error: firstError.message } },
				{ status: 409 }
			);
		} else {
			return json(
				{ data: { success: false, field: 'validation_error', message: 'Validation failed with unknown details', error: 'Validation failed with unknown details' } },
				{ status: 409 }
			);
		}
	}
	
	const message = error instanceof Error ? error.message : 'Unknown error';
	const status = message === 'Unauthorized' ? 401 : message.toLowerCase().includes('not found') ? 404 : 400;
	
	return json({ error: message }, { status });
}
