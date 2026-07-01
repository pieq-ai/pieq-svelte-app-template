import { requirePermission } from '$lib/server/authz/guards';
import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-structure.service.js';
import {
	validateUpdateSalaryStructure,
	validateCreateRevision
} from '$lib/server/validators/salary-structure.validator.js';

export async function GET({ params }) {
	try {
		
		requirePermission(locals.user, 'salary_structure:view');
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
		
		requirePermission(locals.user, 'salary_structure:view');
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
		if ((error as Error).name === 'ConfirmationRequiredError') {
			return json({ data: { confirmationRequired: true } }, { status: 200 });
		}
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		const isValidationError =
			(error as Error).name === 'InvalidEmployeeError' ||
			(error as Error).name === 'InvalidSalaryComponentError' ||
			(error as Error).name === 'DuplicateComponentInStructureError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{ message: (error as Error).message || 'Failed to update salary structure' },
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}

export async function DELETE({ params }) {
	try {
		
		requirePermission(locals.user, 'salary_structure:view');
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

/**
 * POST /api/salary-structures/:cuid
 *
 * Creates a new Salary Structure revision from the given Active source structure.
 * Automatically closes the previous structure (status=Inactive, effective_to = newFrom - 1 day).
 *
 * Body: { effective_from: string, components: [{ salary_component_cuid, amount }] }
 */
export async function POST({ params, request }) {
	try {
		
		requirePermission(locals.user, 'salary_structure:view');
const cuid = params.cuid;
		if (!cuid) {
			return json({ message: 'Invalid salary structure ID' }, { status: 400 });
		}

		const body = await request.json();

		const { errors, validatedData } = validateCreateRevision(body);
		if (errors.length > 0 || !validatedData) {
			const combinedMsg = errors.map((e) => e.message).join(', ');
			return json({ message: `Validation failed: ${combinedMsg}` }, { status: 400 });
		}

		const revision = await service.createRevision(cuid, validatedData);

		return json({ data: { cuid: revision.cuid, message: 'success' } }, { status: 201 });
	} catch (error) {
		console.error(`Error in POST /api/salary-structures/${params.cuid}:`, error);
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		const isValidationError =
			(error as Error).name === 'InvalidSalaryComponentError' ||
			(error as Error).name === 'DuplicateComponentInStructureError' ||
			(error as Error).name === 'SourceStructureNotActiveError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{ message: (error as Error).message || 'Failed to create salary revision' },
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}
