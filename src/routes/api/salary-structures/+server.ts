import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-structure.service.js';
import { validateCreateSalaryStructure } from '$lib/server/validators/salary-structure.validator.js';

export async function GET() {
	try {
		const structures = await service.getStructures();
		return json({ data: structures });
	} catch (error) {
		console.error('Error in GET /api/salary-structures:', error);
		return json(
			{ success: false, message: (error as Error).message || 'Failed to retrieve salary structures' },
			{ status: 500 }
		);
	}
}

export async function POST({ request }) {
	try {
		const body = await request.json();

		const { errors, validatedData } = validateCreateSalaryStructure(body);
		if (errors.length > 0 || !validatedData) {
			const combinedMsg = errors.map((e) => e.message).join(', ');
			return json({ message: `Validation failed: ${combinedMsg}` }, { status: 400 });
		}

		const created = await service.createStructure(validatedData);

		return json({ data: { cuid: created.cuid, message: 'success' } }, { status: 201 });
	} catch (error) {
		console.error('Error in POST /api/salary-structures:', error);
		const isValidationError =
			(error as Error).name === 'InvalidEmployeeError' ||
			(error as Error).name === 'InvalidSalaryComponentError' ||
			(error as Error).name === 'DuplicateComponentInStructureError' ||
			(error as Error).name === 'DuplicateEmployeeStructureError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{ message: (error as Error).message || 'Failed to create salary structure' },
			{ status: isValidationError ? 400 : 500 }
		);
	}
}
