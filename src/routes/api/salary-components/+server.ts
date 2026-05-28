import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-component.service.js';
import { validateCreateSalaryComponent } from '$lib/server/validators/salary-component.validator.js';
import type { SalaryComponentType, MasterStatus } from '$lib/types/salary-component.js';

export async function GET({ url }) {
	try {
		const search = url.searchParams.get('search') || undefined;
		const component_type = (url.searchParams.get('component_type') as SalaryComponentType) || undefined;
		const status = (url.searchParams.get('status') as MasterStatus) || undefined;
		const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : 1;
		const pageSize = url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : 10;
		const sortBy = (url.searchParams.get('sortBy') as 'component_name' | 'component_type' | 'status') || 'component_name';
		const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

		const result = await service.getComponents({
			search,
			component_type,
			status,
			page,
			pageSize,
			sortBy,
			sortOrder
		});

		return json({
			success: true,
			message: 'Salary components retrieved successfully',
			data: result
		});
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
					success: false,
					message: `Validation failed: ${combinedMsg}`
				},
				{ status: 400 }
			);
		}

		// Service creation step
		const created = await service.createComponent(validatedData);

		return json(
			{
				success: true,
				message: 'Salary component created',
				data: created
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error in POST /api/salary-components:', error);
		const isValidationError = (error as Error).name === 'DuplicateComponentError' || (error as Error).name === 'BusinessValidationError';

		return json(
			{
				success: false,
				message: (error as Error).message || 'Failed to create salary component'
			},
			{ status: isValidationError ? 400 : 500 }
		);
	}
}
