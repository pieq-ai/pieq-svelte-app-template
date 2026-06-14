import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as leaveService from '$lib/server/services/leave.service.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { ValidationError } from '$lib/server/utils/errors.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function GET(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const email = event.locals.user?.email || '';
		const year = new Date().getFullYear();

		const details = await leaveService.getEmployeeLeaveDetails(email, year);
		return json({ data: details });
	} catch (error) {
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}

export async function POST(event: RequestEvent) {
	try {
		permissionGuard.requireAuth(event.locals.user);
		const email = event.locals.user?.email || '';

		const body = await event.request.json();
		let documentUrl: string | null = null;

		// Handle file upload if present in standard JSON payload (base64)
		if (body.document) {
			const { fileName, base64Data } = body.document;
			if (fileName && base64Data) {
				const buffer = Buffer.from(base64Data, 'base64');
				const uploadsDir = join(process.cwd(), 'static', 'uploads');
				
				if (!existsSync(uploadsDir)) {
					mkdirSync(uploadsDir, { recursive: true });
				}
				
				const safeName = `${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
				const fullPath = join(uploadsDir, safeName);
				
				writeFileSync(fullPath, buffer);
				documentUrl = `/uploads/${safeName}`;
			}
		}

		const newRequest = await leaveService.applyLeave(email, {
			leaveTypeCuid: body.leaveTypeCuid,
			startDate: body.startDate,
			endDate: body.endDate,
			isHalfDay: body.isHalfDay,
			halfDaySession: body.halfDaySession,
			reason: body.reason,
			documentUrl,
			expectedDeliveryDate: body.expectedDeliveryDate,
			isMiscarriage: body.isMiscarriage,
			childBirthDate: body.childBirthDate
		});

		return json({ data: newRequest }, { status: 201 });
	} catch (error) {
		if (error instanceof ValidationError) {
			return json({ error: error.message, field: error.field }, { status: 400 });
		}
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : 400;
		return json({ error: message }, { status });
	}
}
