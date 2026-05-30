import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-component.service.js';
import { validateCreateSalaryComponent } from '$lib/server/validators/salary-component.validator.js';
import type { SalaryComponentType } from '$lib/types/salary-component.js';
import { serializeSalaryComponentList } from '$lib/server/serializers/salary-component.serializer.js';

export async function GET({ url }) {
	try {
		// Stats shortcut — returns aggregate counts with no row data fetched
		if (url.searchParams.get('stats') === 'true') {
			const stats = await service.getStats();
			return json(stats);
		}

		let search = url.searchParams.get('search') || undefined;
		if (search) {
			search = search.trim().replace(/^["']|["']$/g, '').trim() || undefined;
		}
		const component_type =
			(url.searchParams.get('component_type') as SalaryComponentType) || undefined;

		// Parse is_active filter: 'true' → true, 'false' → false, absent → undefined
		const isActiveParam = url.searchParams.get('is_active');
		const is_active =
			isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

		const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : 1;
		const pageSize = url.searchParams.get('pageSize')
			? Number(url.searchParams.get('pageSize'))
			: 10;
		const sortBy =
			(url.searchParams.get('sortBy') as 'component_name' | 'component_type' | 'is_active') ||
			'component_name';
		const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

		const result = await service.getComponents({
			search,
			component_type,
			is_active,
			page,
			pageSize,
			sortBy,
			sortOrder
		});

		return json(serializeSalaryComponentList(result));
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
		await service.createComponent(validatedData);

		return json(
			{
				message: 'success'
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
