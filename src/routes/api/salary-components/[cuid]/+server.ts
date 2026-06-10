import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-component.service.js';
import { validateUpdateSalaryComponent } from '$lib/server/validators/salary-component.validator.js';
import { serializeSalaryComponent } from '$lib/server/serializers/salary-component.serializer.js';

export async function GET({ params }) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json(
				{
					success: false,
					message: 'Invalid salary component ID'
				},
				{ status: 400 }
			);
		}

		const component = await service.getComponentByCuid(cuid);
		return json({ data: serializeSalaryComponent(component) });
	} catch (error) {
		console.error(`Error in GET /api/salary-components/${params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'ComponentNotFoundError';
		return json(
			{
				success: false,
				message: (error as Error).message || 'Failed to retrieve salary component'
			},
			{ status: isNotFound ? 404 : 500 }
		);
	}
}

export async function PUT({ params, request }) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json(
				{
					message: 'Invalid salary component ID'
				},
				{ status: 400 }
			);
		}

		const body = await request.json();

		// Validation step
		const { errors, validatedData } = validateUpdateSalaryComponent(body);
		if (errors.length > 0 || !validatedData) {
			const combinedMsg = errors.map((e) => e.message).join(', ');
			return json(
				{
					message: `Validation failed: ${combinedMsg}`
				},
				{ status: 400 }
			);
		}

		// Service update step
		const updated = await service.updateComponent(cuid, validatedData);

		return json({
			data: {
				cuid: updated.cuid,
				message: 'success'
			}
		});
	} catch (error) {
		console.error(`Error in PUT /api/salary-components/${params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'ComponentNotFoundError';
		const isValidationError =
			(error as Error).name === 'DuplicateComponentError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{
				message: (error as Error).message || 'Failed to update salary component'
			},
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}

export async function DELETE({ params }) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json(
				{
					success: false,
					message: 'Invalid salary component ID'
				},
				{ status: 400 }
			);
		}

		// Perform soft delete by setting status to false
		await service.toggleComponentStatus(cuid, false);

		return json({
			data: {
				message: 'success'
			}
		});
	} catch (error) {
		console.error(`Error in DELETE /api/salary-components/${params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'ComponentNotFoundError';
		return json(
			{
				success: false,
				message: (error as Error).message || 'Failed to deactivate salary component'
			},
			{ status: isNotFound ? 404 : 500 }
		);
	}
}
