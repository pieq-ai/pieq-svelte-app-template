<script lang="ts">
	import { Input, Label, Button, CrudModal, StatusDropdown, ConfirmModal } from '$lib/components';
	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';
	import { localApi, ApiError } from '$lib/api/local';
	import { createDirtyChecker } from '$lib/utils';
	import { globalIsDirty } from '$lib/stores/navigationGuard';

	interface Designation {
		cuid: string;
		name: string;
		status: boolean;
	}

	let { 
		open = $bindable(false), 
		editingDesignation = null, 
		onSuccess 
	}: { 
		open: boolean; 
		editingDesignation?: Designation | null; 
		onSuccess?: (designation: any) => void;
	} = $props();

	let formDesignationName = $state('');
	let formDesignationStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isNameTouched = $state(false);
	let backendError = $state('');
	let designationNameInput = $state<HTMLInputElement | null>(null);
	let showConfirmClose = $state(false);

	const dirtyChecker = createDirtyChecker<{ name: string; status: boolean }>();
	let isDirty = $derived(open && dirtyChecker.isDirty({ name: formDesignationName.trim(), status: formDesignationStatus }));

	$effect(() => {
		if (open) {
			const initialName = editingDesignation ? editingDesignation.name : '';
			const initialStatus = editingDesignation ? editingDesignation.status : true;
			formDesignationName = initialName;
			formDesignationStatus = initialStatus;
			isNameTouched = false;
			backendError = '';
			dirtyChecker.snapshot({ name: initialName, status: initialStatus });
		}
	});

	$effect(() => {
		if (open && isDirty) {
			$globalIsDirty = true;
		} else if (!open) {
			$globalIsDirty = false;
		}
	});

	function getValidationError(name: string): string {
		const trimmed = name.trim();
		if (trimmed === '') return 'Designation name is required';
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (trimmed.length > 100) return 'Maximum 100 characters allowed';
		const regex = /^[A-Za-z0-9\s-]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters, numbers, spaces, and hyphens are allowed';
		}
		return '';
	}

	let nameValidationError = $derived(isNameTouched ? getValidationError(formDesignationName) : '');

	async function handleSaveDesignation(e: Event) {
		e.preventDefault();
		if (editingDesignation && !isDirty) return;
		isNameTouched = true;

		const validationError = getValidationError(formDesignationName);
		if (validationError) {
			designationNameInput?.focus();
			return;
		}

		isSubmitting = true;

		try {
			const payload = { name: formDesignationName.trim(), status: formDesignationStatus };
			let res: any;
			if (editingDesignation) {
				res = await localApi.put(`/api/designations/${editingDesignation.cuid}`, payload);
			} else {
				res = await localApi.post('/api/designations', payload);
			}

			toast.success(editingDesignation ? 'Designation updated successfully' : 'Designation created successfully');
			open = false;
			$globalIsDirty = false;
			onSuccess?.(res.data);
		} catch (err) {
			backendError = err instanceof ApiError ? err.message : 'Something went wrong.';
			if (err instanceof ApiError && err.status === 409) {
				designationNameInput?.focus();
			} else {
				toast.error(backendError);
			}
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		if (isDirty) {
			showConfirmClose = true;
		} else {
			open = false;
			$globalIsDirty = false;
		}
	}
</script>

<CrudModal
	{open}
	title={editingDesignation ? 'Edit Designation' : 'Create Designation'}
	{isSubmitting}
	onClose={handleClose}
>
	{#snippet children({ cancel })}
		<form class="space-y-3" onsubmit={handleSaveDesignation}>
			<div class="space-y-2">
				<Label for="name">Designation Name</Label>
				<Input
					id="name"
					name="name"
					bind:ref={designationNameInput}
					bind:value={formDesignationName}
					class={nameValidationError || backendError ? 'border-destructive' : ''}
					placeholder="e.g. Senior HR Manager"
					oninput={() => { backendError = ''; }}
				/>
				{#if nameValidationError || backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{nameValidationError || backendError}</p>
				{/if}
			</div>
			{#if editingDesignation}
				<StatusDropdown id="designation_status" name="designation_status" value={formDesignationStatus} onChange={(val) => (formDesignationStatus = val)} />
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingDesignation && !isDirty)}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingDesignation ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<ConfirmModal
	open={showConfirmClose}
	title="Unsaved Changes"
	description="You have unsaved changes. Are you sure you want to close this modal?"
	confirmLabel="Cancel"
	cancelLabel="Keep Editing"
	onConfirm={() => {
		showConfirmClose = false;
		open = false;
		$globalIsDirty = false;
	}}
	onCancel={() => {
		showConfirmClose = false;
	}}
/>
