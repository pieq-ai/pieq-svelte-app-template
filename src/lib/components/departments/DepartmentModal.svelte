<script lang="ts">
	import { Input, Label, Button, CrudModal, StatusDropdown } from '$lib/components';
	import { toast } from '$lib/toast';
	import { UI_CONSTANTS } from '$lib/constants';
	import { localApi, ApiError } from '$lib/api/local';
	import { createDirtyChecker } from '$lib/utils';
	import { globalIsDirty } from '$lib/stores/navigationGuard';

	interface Department {
		cuid: string;
		name: string;
		status: boolean;
	}

	let { 
		open = $bindable(false), 
		editingDept = null, 
		onSuccess 
	}: { 
		open: boolean; 
		editingDept?: Department | null; 
		onSuccess?: (dept: any) => void;
	} = $props();

	let formDeptName = $state('');
	let formDeptStatus = $state<boolean>(true);
	let isSubmitting = $state(false);
	let isNameTouched = $state(false);
	let backendError = $state('');
	let deptNameInput = $state<HTMLInputElement | null>(null);

	const dirtyChecker = createDirtyChecker<{ name: string; status: boolean }>();
	let isDirty = $derived(open && dirtyChecker.isDirty({ name: formDeptName.trim(), status: formDeptStatus }));

	$effect(() => {
		if (open) {
			formDeptName = editingDept ? editingDept.name : '';
			formDeptStatus = editingDept ? editingDept.status : true;
			isNameTouched = false;
			backendError = '';
			dirtyChecker.snapshot({ name: formDeptName, status: formDeptStatus });
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
		if (trimmed === '') return 'Department name is required';
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (trimmed.length > 100) return 'Maximum 100 characters allowed';
		const regex = /^[A-Za-z0-9\s-]+$/;
		if (!regex.test(trimmed)) {
			return 'Only letters, numbers, spaces, and hyphens are allowed';
		}
		return '';
	}

	let nameValidationError = $derived(isNameTouched ? getValidationError(formDeptName) : '');

	async function handleSaveDepartment(e: Event) {
		e.preventDefault();
		if (editingDept && !isDirty) return;
		isNameTouched = true;

		const validationError = getValidationError(formDeptName);
		if (validationError) {
			deptNameInput?.focus();
			return;
		}

		isSubmitting = true;

		try {
			const payload = { name: formDeptName.trim(), status: formDeptStatus };
			let res;
			if (editingDept) {
				res = await localApi.put(`/api/departments/${editingDept.cuid}`, payload);
			} else {
				res = await localApi.post('/api/departments', payload);
			}

			toast.success(editingDept ? 'Department updated successfully' : 'Department created successfully');
			open = false;
			$globalIsDirty = false;
			onSuccess?.(res.data);
		} catch (err) {
			backendError = err instanceof ApiError ? err.message : 'Something went wrong.';
			if (err instanceof ApiError && err.status === 409) {
				deptNameInput?.focus();
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
	title={editingDept ? 'Edit Department' : 'Create Department'}
	{isDirty}
	{isSubmitting}
	onClose={() => { open = false; $globalIsDirty = false; }}
>
	{#snippet children({ cancel })}
		<form class="space-y-3" onsubmit={handleSaveDepartment}>
			<div class="space-y-2">
				<Label for="name">Department Name</Label>
				<Input
					id="name"
					name="name"
					bind:ref={deptNameInput}
					bind:value={formDeptName}
					class={nameValidationError || backendError ? 'border-destructive' : ''}
					placeholder="e.g. Finance"
					oninput={() => { backendError = ''; }}
				/>
				{#if nameValidationError || backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{nameValidationError || backendError}</p>
				{/if}
			</div>
			{#if editingDept}
				<StatusDropdown id="dept_status" name="dept_status" value={formDeptStatus} onChange={(val) => (formDeptStatus = val)} />
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel} disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting || (!!editingDept && !isDirty)}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingDept ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>
