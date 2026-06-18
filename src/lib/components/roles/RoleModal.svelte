<script lang="ts">
	import { Input, Label, Button, CrudModal, StatusDropdown } from '$lib/components';
	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';
	import { localApi, ApiError } from '$lib/api/local';
	import { createDirtyChecker } from '$lib/utils';
	import { globalIsDirty } from '$lib/stores/navigationGuard';

	interface Role {
		cuid: string;
		name: string;
		status: boolean;
	}

	let { 
		open = $bindable(false), 
		editingRole = null, 
		onSuccess 
	}: { 
		open: boolean; 
		editingRole?: Role | null; 
		onSuccess?: (role: any) => void;
	} = $props();

	let formRoleName = $state('');
	let formRoleStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isNameTouched = $state(false);
	let backendError = $state('');
	let roleNameInput = $state<HTMLInputElement | null>(null);

	const dirtyChecker = createDirtyChecker<{ name: string; status: boolean }>();
	let isDirty = $derived(open && dirtyChecker.isDirty({ name: formRoleName.trim(), status: formRoleStatus }));

	$effect(() => {
		if (open) {
			formRoleName = editingRole ? editingRole.name : '';
			formRoleStatus = editingRole ? editingRole.status : true;
			isNameTouched = false;
			backendError = '';
			dirtyChecker.snapshot({ name: formRoleName, status: formRoleStatus });
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
		if (trimmed === '') return 'Role name is required';
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (trimmed.length > 100) return 'Maximum 100 characters allowed';
		const regex = /^[A-Za-z0-9\s-]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters, numbers, spaces, and hyphens are allowed';
		}
		return '';
	}

	let nameValidationError = $derived(isNameTouched ? getValidationError(formRoleName) : '');

	async function handleSaveRole(e: Event) {
		e.preventDefault();
		if (editingRole && !isDirty) return;
		isNameTouched = true;

		const validationError = getValidationError(formRoleName);
		if (validationError) {
			roleNameInput?.focus();
			return;
		}

		isSubmitting = true;

		try {
			let res;
			if (editingRole) {
				const payload = { name: formRoleName.trim(), status: formRoleStatus };
				res = await localApi.put(`/api/roles/${editingRole.cuid}`, payload);
			} else {
				const payload = { name: formRoleName.trim() };
				res = await localApi.post('/api/roles', payload);
			}

			toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
			open = false;
			$globalIsDirty = false;
			onSuccess?.(res.data);
		} catch (err) {
			backendError = err instanceof ApiError ? err.message : 'Something went wrong.';
			if (err instanceof ApiError && err.status === 409) {
				roleNameInput?.focus();
			} else {
				toast.error(backendError);
			}
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<CrudModal
	{open}
	title={editingRole ? 'Edit Role' : 'Create Role'}
	{isDirty}
	{isSubmitting}
	onClose={() => { open = false; $globalIsDirty = false; }}
>
	{#snippet children({ cancel })}
		<form class="space-y-3" onsubmit={handleSaveRole}>
			<div class="space-y-2">
				<Label for="name">Role Name</Label>
				<Input
					id="name"
					name="name"
					bind:ref={roleNameInput}
					bind:value={formRoleName}
					class={nameValidationError || backendError ? 'border-destructive' : ''}
					placeholder="e.g. HR Manager"
					oninput={() => { backendError = ''; }}
				/>
				{#if nameValidationError || backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{nameValidationError || backendError}</p>
				{/if}
			</div>
			{#if editingRole}
				<StatusDropdown id="role_status" name="role_status" value={formRoleStatus} onChange={(val) => (formRoleStatus = val)} />
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingRole && !isDirty)}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingRole ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>
