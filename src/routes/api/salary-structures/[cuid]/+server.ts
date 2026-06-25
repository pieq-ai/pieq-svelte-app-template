import { json } from '@sveltejs/kit';
import * as service from '$lib/server/services/salary-structure.service.js';
import {
	validateUpdateSalaryStructure,
	validateCreateRevision
} from '$lib/server/validators/salary-structure.validator.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

export async function GET(event) {
	const params = event.params;
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_view');
		const cuid = params.cuid;
		if (!cuid) {
			return json({ success: false, message: 'Invalid salary structure ID' }, { status: 400 });
		}

		const structure = await service.getStructureByCuid(cuid);
		return json({ data: structure });
	} catch (error) {
		console.error(`Error in GET /api/salary-structures/${params.cuid}:`, error);
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ success: false, message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		return json(
			{ success: false, message: message || 'Failed to retrieve salary structure' },
			{ status: isNotFound ? 404 : 500 }
		);
	}
}

export async function PUT(event) {
	const params = event.params;
	const request = event.request;
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_edit');
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
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
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
			{ message: message || 'Failed to update salary structure' },
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}

export async function DELETE(event) {
	const params = event.params;
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_edit');
		const cuid = params.cuid;
		if (!cuid) {
			return json({ success: false, message: 'Invalid salary structure ID' }, { status: 400 });
		}

		await service.deactivateStructure(cuid);
		return json({ data: { message: 'success' } });
	} catch (error) {
		console.error(`Error in DELETE /api/salary-structures/${params.cuid}:`, error);
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ success: false, message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		return json(
			{ success: false, message: message || 'Failed to deactivate salary structure' },
			{ status: isNotFound ? 404 : 500 }
		);
	}
}

export async function POST(event) {
	const params = event.params;
	const request = event.request;
	try {
		await permissionGuard.requirePermission(event.locals.user, event.locals.roles, 'salary_structure_create');
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
		const message = (error as Error).message;
		if (message === 'Unauthorized' || message === 'Forbidden') {
			return json({ message }, { status: message === 'Unauthorized' ? 401 : 403 });
		}
		const isNotFound = (error as Error).name === 'SalaryStructureNotFoundError';
		const isValidationError =
			(error as Error).name === 'InvalidSalaryComponentError' ||
			(error as Error).name === 'DuplicateComponentInStructureError' ||
			(error as Error).name === 'SourceStructureNotActiveError' ||
			(error as Error).name === 'BusinessValidationError';

		return json(
			{ message: message || 'Failed to create salary revision' },
			{ status: isNotFound ? 404 : isValidationError ? 400 : 500 }
		);
	}
}
