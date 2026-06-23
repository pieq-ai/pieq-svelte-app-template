<script lang="ts">
	import { Input, Label, Button, CrudModal, StatusDropdown, ConfirmModal } from '$lib/components';
	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';
	import { localApi, ApiError } from '$lib/api/local';
	import { createDirtyChecker } from '$lib/utils';
	import { globalIsDirty } from '$lib/stores/navigationGuard';

	interface SimpleMaster {
		cuid: string;
		name: string;
		status: boolean;
	}

	let { 
		open = $bindable(false), 
		editingRecord = null, 
        entityName,
        apiEndpoint,
		onSuccess 
	}: { 
		open: boolean; 
		editingRecord?: SimpleMaster | null; 
        entityName: string;
        apiEndpoint: string;
		onSuccess?: (record: any) => void;
	} = $props();

	let formName = $state('');
	let formStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isNameTouched = $state(false);
	let backendError = $state('');
	let nameInput = $state<HTMLInputElement | null>(null);
	let showConfirmClose = $state(false);

	const dirtyChecker = createDirtyChecker<{ name: string; status: boolean }>();
	let isDirty = $derived(open && dirtyChecker.isDirty({ name: formName.trim(), status: formStatus }));

	$effect(() => {
		if (open) {
			const initialName = editingRecord ? editingRecord.name : '';
			const initialStatus = editingRecord ? editingRecord.status : true;
			formName = initialName;
			formStatus = initialStatus;
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
		if (trimmed === '') return `${entityName} name is required`;
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (trimmed.length > 100) return 'Maximum 100 characters allowed';
		const regex = /^[A-Za-z0-9\s-]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters, numbers, spaces, and hyphens are allowed';
		}
		return '';
	}

	let nameValidationError = $derived(isNameTouched ? getValidationError(formName) : '');

	async function handleSave(e: Event) {
		e.preventDefault();
		if (editingRecord && !isDirty) return;
		isNameTouched = true;

		const validationError = getValidationError(formName);
		if (validationError) {
			nameInput?.focus();
			return;
		}

		isSubmitting = true;

		try {
			const payload: any = { name: formName.trim() };
			if (editingRecord) {
				payload.status = formStatus;
			}
			
			let res: any;
			if (editingRecord) {
				res = await localApi.put(`${apiEndpoint}/${editingRecord.cuid}`, payload);
			} else {
				res = await localApi.post(apiEndpoint, payload);
			}

			toast.success(editingRecord ? `${entityName} updated successfully` : `${entityName} created successfully`);
			open = false;
			$globalIsDirty = false;
			onSuccess?.(res.data);
		} catch (err) {
			backendError = err instanceof ApiError ? err.message : 'Something went wrong.';
			if (err instanceof ApiError && err.status === 409) {
				nameInput?.focus();
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
	title={editingRecord ? `Edit ${entityName}` : `Create ${entityName}`}
	{isSubmitting}
	onClose={handleClose}
>
	{#snippet children({ cancel })}
		<form class="space-y-3" onsubmit={handleSave}>
			<div class="space-y-2">
				<Label for="name">{entityName} Name</Label>
				<Input
					id="name"
					name="name"
					bind:ref={nameInput}
					bind:value={formName}
					class={nameValidationError || backendError ? 'border-destructive' : ''}
					placeholder={`e.g. ${entityName === 'Department' ? 'Finance' : entityName === 'Role' ? 'HR Manager' : 'Senior ' + entityName}`}
					oninput={() => { backendError = ''; }}
				/>
				{#if nameValidationError || backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{nameValidationError || backendError}</p>
				{/if}
			</div>
			{#if editingRecord}
				<StatusDropdown id="record_status" name="record_status" value={formStatus} onChange={(val) => (formStatus = val)} />
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingRecord && !isDirty)}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingRecord ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>

<ConfirmModal
	open={showConfirmClose}
	title="Cancel Changes"
	description="Are you sure you want to cancel? All unsaved changes will be lost."
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
