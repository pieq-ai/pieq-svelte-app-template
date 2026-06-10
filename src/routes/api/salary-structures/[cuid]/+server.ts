import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-structure.service.js';
import { validateUpdateSalaryStructure } from '$lib/server/validators/salary-structure.validator.js';

export async function GET({ params }) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json({ success: false, message: 'Invalid salary structure ID' }, { status: 400 });
		}

		const structure = await service.getStructureByCuid(cuid);
		return json({ data: structure });
	} catch (error) {
		console.error(`Error in GET /api/salary-structures/${params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		return json(
			{ success: false, message: (error as Error).message || 'Failed to retrieve salary structure' },
			{ status: isNotFound ? 404 : 500 }
		);
	}
}

export async function PUT({ params, request }) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json({ message: 'Invalid salary structure ID' }, { status: 400 });
		}

		const body = await request.json();

		const { errors, validatedData } = validateUpdateSalaryStructure(body);
		if (errors.length > 0 || !validatedData) {
			const combinedMsg = errors.map((e) => e.message).join(', ');
			return json({ message: `Validation failed: ${combinedMsg}` }, { status: 400 });
		}

		const updated = await service.updateStructure(cuid, validatedData);
		return json({ data: { cuid: updated.cuid, message: 'success' } });
	} catch (error) {
		console.error(`Error in PUT /api/salary-structures/${params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		const isValidationError =
			(error as Error).name === 'InvalidEmployeeError' ||
			(error as Error).name === 'InvalidSalaryComponentError' ||
			(error as Error).name === 'DuplicateComponentInStructureError' ||
			(error as Error).name === 'DuplicateEmployeeStructureError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{ message: (error as Error).message || 'Failed to update salary structure' },
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}

export async function DELETE({ params }) {
	try {
		const cuid = params.cuid;
		if (!cuid) {
			return json({ success: false, message: 'Invalid salary structure ID' }, { status: 400 });
		}

		await service.deactivateStructure(cuid);
		return json({ data: { message: 'success' } });
	} catch (error) {
		console.error(`Error in DELETE /api/salary-structures/${params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		return json(
			{ success: false, message: (error as Error).message || 'Failed to deactivate salary structure' },
			{ status: isNotFound ? 404 : 500 }
		);
	}
}
