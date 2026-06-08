import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-component.service.js';
import { validateCreateSalaryComponent } from '$lib/server/validators/salary-component.validator.js';
import { serializeSalaryComponent } from '$lib/server/serializers/salary-component.serializer.js';

export async function GET() {
	try {
		// Fetch all records with a stable default order — search & sort are client-side
		const result = await service.getComponents();

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

export async function POST({ request, locals }) {
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

		// Retrieve authenticated user ID
		let userId: string | null = null;
		try {
			const session = await locals.auth();
			userId = session?.user?.id ?? null;
		} catch (authError) {
			console.warn('Failed to retrieve session from locals.auth():', authError);
		}

		// Service creation step
		const created = await service.createComponent({
			...validatedData,
			created_by: userId
		});

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

export async function PUT({ url, request, locals }) {
	try {
		const cuid = url.searchParams.get('salaryComponentCuid');
		if (!cuid) {
			return json(
				{ message: 'Missing required query parameter: salaryComponentCuid' },
				{ status: 400 }
			);
		}

		const body = await request.json();

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
			const session = await locals.auth();
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
		console.error('Error in PUT /api/salary-components:', error);
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
