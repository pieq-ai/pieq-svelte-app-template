<script lang="ts">
	import { onMount } from 'svelte';
	import { UI_CONSTANTS } from '$lib/constants';
	import { Alert, AlertDescription, Button, CrudModal, Input, Label, SearchableDropdown } from '$lib/components';

	interface Props {
		label?: string;
		value: string | string[];
		multiple?: boolean;
		placeholder?: string;
		onSelect: (id: string | string[]) => void;
	}

	let {
		label = 'Designation',
		value,
		multiple = false,
		placeholder,
		onSelect
	}: Props = $props();

	let options = $state<{id: string; label: string}[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state('');
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let inputValue = $state('');
	let isValueTouched = $state(false);
	let backendError = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);

	function getValidationError(input: string) {
		const trimmed = input.trim();
		if (!trimmed) return `Designation name is required`;
		if (trimmed.length < 2) return 'Minimum 2 characters required';
		if (!/^[A-Za-z0-9\s-]+$/.test(trimmed)) return 'Invalid characters in designation';
		return '';
	}

	let validationError = $derived(isValueTouched ? getValidationError(inputValue) : '');

	async function loadOptions() {
		isLoading = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/designations`);
			const body = await response.json();
			if (response.ok) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				options = (body.data ?? []).filter((d: any) => d.status).map((d: any) => ({ id: d.cuid, label: d.designation_name }));
			} else {
				errorMessage = body.error || `Failed to load options.`;
			}
		} finally {
			isLoading = false;
		}
	}

	onMount(loadOptions);

	function openCreateModal() {
		inputValue = '';
		errorMessage = '';
		backendError = '';
		isValueTouched = false;
		isModalOpen = true;
	}

	async function saveValue(event: Event) {
		event.preventDefault();
		isValueTouched = true;
		if (getValidationError(inputValue)) {
			inputRef?.focus();
			return;
		}

		isSubmitting = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/designations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ designation_name: inputValue.trim(), status: true })
			});
			const body = await response.json();
			if (response.ok) {
				await loadOptions();
				if (body.data?.cuid) {
					onSelect(body.data.cuid);
				}
				isModalOpen = false;
			} else if (response.status === 409) {
				backendError = body.error;
				inputRef?.focus();
			} else {
				errorMessage = body.error || `Unable to save.`;
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-2">
	<SearchableDropdown
		label={label}
		{options}
		{value}
		{multiple}
		{placeholder}
		permissions={{ canCreate: true, canEdit: false, canDelete: false }}
		{onSelect}
		onAdd={openCreateModal}
	/>
	{#if isLoading}
		<p class="text-xs text-muted-foreground">Loading options...</p>
	{/if}
	{#if errorMessage && !isModalOpen}
		<Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>
	{/if}
</div>

<CrudModal
	open={isModalOpen}
	title="Add Designation"
	description="Create a new designation."
	onClose={() => (isModalOpen = false)}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={saveValue}>
			<div class="space-y-2">
				<Label for="des_val">Designation Name</Label>
				<Input
					id="des_val"
					bind:ref={inputRef}
					bind:value={inputValue}
					class={validationError || backendError ? 'border-destructive' : ''}
					oninput={() => { backendError = ''; }}
				/>
				{#if validationError || backendError}
					<p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{validationError || backendError}</p>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={cancel}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitting}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : UI_CONSTANTS.BUTTON_SAVE}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>
