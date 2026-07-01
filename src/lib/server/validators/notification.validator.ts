import { ValidationError } from '$lib/server/utils/errors.js';

const VALID_CATEGORIES = new Set([
	'birthday',
	'holiday',
	'announcement',
	'payroll',
	'leave',
	'attendance',
	'system'
]);

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

const VALID_TYPES = new Set(['info', 'success', 'warning', 'error']);

export interface ValidatedNotificationData {
	title: string;
	body: string;
	category: string;
	priority: string;
	type: string;
	metadata?: any;
	created_by?: string | null;
}

/**
 * Validates notification create payload.
 */
export function validateNotification(data: any): ValidatedNotificationData {
	if (!data) {
		throw new Error('Notification data is required');
	}

	const title = typeof data.title === 'string' ? data.title.trim() : '';
	if (!title) {
		throw new ValidationError('title', 'Notification title is required');
	}
	if (title.length > 200) {
		throw new ValidationError('title', 'Notification title cannot exceed 200 characters');
	}

	const body = typeof data.body === 'string' ? data.body.trim() : '';
	if (!body) {
		throw new ValidationError('body', 'Notification body is required');
	}

	const category = typeof data.category === 'string' ? data.category.trim().toLowerCase() : '';
	if (!category) {
		throw new ValidationError('category', 'Notification category is required');
	}
	if (!VALID_CATEGORIES.has(category)) {
		throw new ValidationError('category', `Invalid category. Must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`);
	}

	const priority = typeof data.priority === 'string' ? data.priority.trim().toLowerCase() : 'medium';
	if (!VALID_PRIORITIES.has(priority)) {
		throw new ValidationError('priority', `Invalid priority. Must be one of: ${Array.from(VALID_PRIORITIES).join(', ')}`);
	}

	const type = typeof data.type === 'string' ? data.type.trim().toLowerCase() : 'info';
	if (!VALID_TYPES.has(type)) {
		throw new ValidationError('type', `Invalid type. Must be one of: ${Array.from(VALID_TYPES).join(', ')}`);
	}

	return {
		title,
		body,
		category,
		priority,
		type,
		metadata: data.metadata ?? null,
		created_by: typeof data.created_by === 'string' ? data.created_by : null
	};
}
