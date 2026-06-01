import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-component.service.js';
import { validateCreateSalaryComponent } from '$lib/server/validators/salary-component.validator.js';
import { serializeSalaryComponent } from '$lib/server/serializers/salary-component.serializer.js';

export async function GET({ url }) {
	try {
		let search = url.searchParams.get('search') || undefined;
		if (search) {
			search = search.trim().replace(/^["']|["']$/g, '').trim() || undefined;
		}

		const sortBy =
			(url.searchParams.get('sortBy') as 'component_name' | 'component_type' | 'is_active') ||
			'component_name';
		const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

		const result = await service.getComponents({
			search,
			sortBy,
			sortOrder
		});

		return json({ data: result.items.map(serializeSalaryComponent) });
	} catch (error) {
		console.error('Error in GET /api/salary-components:', error);
		return json(
			{
				success: false,
				message: (error as Error).message || 'Failed to retrieve salary components'
			},
			{ status: 500 }
		);
	}
}

export async function POST({ request }) {
	try {
		const body = await request.json();

		// Validation step
		const { errors, validatedData } = validateCreateSalaryComponent(body);
		if (errors.length > 0 || !validatedData) {
			const combinedMsg = errors.map((e) => e.message).join(', ');
			return json(
				{
					message: `Validation failed: ${combinedMsg}`
				},
				{ status: 400 }
			);
		}

		// Service creation step
		const created = await service.createComponent(validatedData);

		return json(
			{
				data: {
					cuid: created.cuid,
					message: 'success'
				}
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error in POST /api/salary-components:', error);
		const isValidationError =
			(error as Error).name === 'DuplicateComponentError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{
				message: (error as Error).message || 'Failed to create salary component'
			},
			{ status: isValidationError ? 400 : 500 }
		);
	}
}
