import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-component.service.js';
import { validateUpdateSalaryComponent } from '$lib/server/validators/salary-component.validator.js';

export async function GET({ params }) {
	try {
		const id = Number(params.id);
		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'Invalid salary component ID'
				},
				{ status: 400 }
			);
		}

		const component = await service.getComponentById(id);
		return json({
			success: true,
			message: 'Salary component retrieved successfully',
			data: component
		});
	} catch (error) {
		console.error(`Error in GET /api/salary-components/${params.id}:`, error);
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
		const id = Number(params.id);
		if (isNaN(id)) {
			return json(
				{
					success: false,
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
					success: false,
					message: `Validation failed: ${combinedMsg}`
				},
				{ status: 400 }
			);
		}

		// Service update step
		const updated = await service.updateComponent(id, validatedData);

		return json({
			success: true,
			message: 'Salary component updated',
			data: updated
		});
	} catch (error) {
		console.error(`Error in PUT /api/salary-components/${params.id}:`, error);
		const isNotFound = (error as Error).name === 'ComponentNotFoundError';
		const isValidationError = (error as Error).name === 'DuplicateComponentError' || (error as Error).name === 'BusinessValidationError';

		return json(
			{
				success: false,
				message: (error as Error).message || 'Failed to update salary component'
			},
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}

export async function DELETE({ params }) {
	try {
		const id = Number(params.id);
		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'Invalid salary component ID'
				},
				{ status: 400 }
			);
		}

		// Perform soft delete by setting status to inactive
		const softDeleted = await service.toggleComponentStatus(id, 'inactive');

		return json({
			success: true,
			message: 'Salary component deactivated successfully',
			data: softDeleted
		});
	} catch (error) {
		console.error(`Error in DELETE /api/salary-components/${params.id}:`, error);
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
