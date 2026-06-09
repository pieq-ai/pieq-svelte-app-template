import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-component.service.js';
import { validateUpdateSalaryComponent } from '$lib/server/validators/salary-component.validator.js';
import { serializeSalaryComponent } from '$lib/server/serializers/salary-component.serializer.js';

export async function GET(event: RequestEvent) {
	try {
		const cuid = event.params.cuid;
		if (!cuid) {
			return json({ message: 'Salary component CUID is required' }, { status: 400 });
		}

		const component = await service.getComponentByCuid(cuid);
		return json({ data: serializeSalaryComponent(component) });
	} catch (error) {
		console.error(`Error in GET /api/salary-components/salaryComponentCuid=${event.params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'ComponentNotFoundError';
		return json(
			{ message: (error as Error).message || 'Failed to retrieve salary component' },
			{ status: isNotFound ? 404 : 500 }
		);
	}
}

export async function PUT(event: RequestEvent) {
	try {
		const cuid = event.params.cuid;
		if (!cuid) {
			return json({ message: 'Salary component CUID is required' }, { status: 400 });
		}

		const body = await event.request.json();

		// Validation step
		const { errors, validatedData } = validateUpdateSalaryComponent(body);
		if (errors.length > 0 || !validatedData) {
			const combinedMsg = errors.map((e) => e.message).join(', ');
			return json(
				{ message: `Validation failed: ${combinedMsg}` },
				{ status: 400 }
			);
		}

		// Retrieve authenticated user ID
		let userId: string | null = null;
		try {
			const session = await event.locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		// Service update step
		const updated = await service.updateComponent(cuid, {
			...validatedData,
			updated_by: userId
		});

		return json({
			data: {
				cuid: updated.cuid,
				message: 'success'
			}
		});
	} catch (error) {
		console.error(`Error in PUT /api/salary-components/salaryComponentCuid=${event.params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'ComponentNotFoundError';
		const isValidationError =
			(error as Error).name === 'DuplicateComponentError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{ message: (error as Error).message || 'Failed to update salary component' },
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}

export async function DELETE(event: RequestEvent) {
	try {
		const cuid = event.params.cuid;
		if (!cuid) {
			return json({ message: 'Salary component CUID is required' }, { status: 400 });
		}

		// Retrieve authenticated user ID
		let userId: string | null = null;
		try {
			const session = await event.locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		// Soft-delete/deactivate the component (setting status to false)
		const disabled = await service.toggleComponentStatus(cuid, false, userId);

		return json({
			data: {
				cuid: disabled.cuid,
				message: 'Successfully disabled'
			}
		});
	} catch (error) {
		console.error(`Error in DELETE /api/salary-components/salaryComponentCuid=${event.params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'ComponentNotFoundError';
		return json(
			{ message: (error as Error).message || 'Failed to disable salary component' },
			{ status: isNotFound ? 404 : 500 }
		);
	}
}
