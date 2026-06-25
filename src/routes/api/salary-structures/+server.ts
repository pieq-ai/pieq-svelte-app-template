import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-structure.service.js';
import { validateCreateSalaryStructure } from '$lib/server/validators/salary-structure.validator.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event) {
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_view');
		const structures = await service.getStructures();
		return json({ data: structures });
	} catch (error) {
		console.error('Error in GET /api/salary-structures:', error);
		const message = (error as Error).message;
		const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
		return json(
			{ success: false, message: message || 'Failed to retrieve salary structures' },
			{ status }
		);
	}
}

export async function POST(event) {
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_create');
		const body = await event.request.json();

		const { errors, validatedData } = validateCreateSalaryStructure(body);
		if (errors.length > 0 || !validatedData) {
			const combinedMsg = errors.map((e) => e.message).join(', ');
			return json({ message: `Validation failed: ${combinedMsg}` }, { status: 400 });
		}

		const created = await service.createStructure(validatedData);

		return json({ data: { cuid: created.cuid, message: 'success' } }, { status: 201 });
	} catch (error) {
		console.error('Error in POST /api/salary-structures:', error);
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
		if ((error as Error).name === 'ConfirmationRequiredError') {
			return json({ data: { confirmationRequired: true } }, { status: 200 });
		}
		const isValidationError =
			(error as Error).name === 'InvalidEmployeeError' ||
			(error as Error).name === 'InvalidSalaryComponentError' ||
			(error as Error).name === 'DuplicateComponentInStructureError' ||
			(error as Error).name === 'ActiveStructureExistsError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{ message: message || 'Failed to create salary structure' },
			{ status: isValidationError ? 400 : 500 }
		);
	}
}
