<script lang="ts">
	import { onMount } from 'svelte';
	import { UI_CONSTANTS } from '$lib/constants';
	import { Alert, AlertDescription, Button, CrudModal, Input, Label, SearchableDropdown } from '$lib/components';
	import { getMasterConfig, type MasterKey } from '$lib/master-data/master-config';
	import { getMasterPermissions, type MasterPermissionConfig } from '$lib/permissions/mock-permissions';
	import type { DropdownOption } from './SearchableDropdown.svelte';

	interface Props {
		master: MasterKey;
		label?: string;
		value: string | string[];
		multiple?: boolean;
		countryCuid?: string;
		placeholder?: string;
		permissions?: Partial<MasterPermissionConfig>;
		onSelect: (id: string) => void;
	}

	let {
		master,
		label,
		value,
		multiple = false,
		countryCuid,
		placeholder,
		permissions = getMasterPermissions(),
		onSelect
	}: Props = $props();

	let config = $derived(getMasterConfig(master));
	let options = $state<DropdownOption[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state('');
	let isModalOpen = $state(false);
	let isSubmitting = $state(false);
	let editingOption = $state<DropdownOption | null>(null);
	let masterValue = $state('');
	let isValueTouched = $state(false);
	let backendError = $state('');
	let masterInput = $state<HTMLInputElement | null>(null);

	function getValidationError(input: string) {
		const trimmed = input.trim();
		if (!trimmed) return `${config.label} is required`;
		if (master === 'blood-groups' && !/^(A|B|AB|O)[+-]$/i.test(trimmed)) {
			return 'Use A+, A-, B+, B-, AB+, AB-, O+, or O-';
		}
		if (master === 'languages' && !/^[\p{L} ]+$/u.test(trimmed)) {
			return 'Only letters and spaces are allowed';
		}
		if (master !== 'blood-groups' && master !== 'languages' && !/^[A-Za-z0-9 ]+$/.test(trimmed)) {
			return 'Only letters, numbers, and spaces are allowed';
		}
		if (master === 'states' && !countryCuid) {
			return 'Select a country before adding a state';
		}
		return '';
	}

	let validationError = $derived(isValueTouched ? getValidationError(masterValue) : '');

	async function loadOptions() {
		isLoading = true;
		errorMessage = '';
		const query = countryCuid ? `?countryCuid=${encodeURIComponent(countryCuid)}` : '';
		try {
			const response = await fetch(`/api/master-data/${master}${query}`);
			const body = await response.json();
			if (response.ok) {
				options = body.data ?? [];
			} else {
				errorMessage = body.error || `Failed to load ${config.label.toLowerCase()} options.`;
			}
		} finally {
			isLoading = false;
		}
	}

	onMount(loadOptions);

	$effect(() => {
		if (master === 'states') {
			loadOptions();
		}
	});

	function openCreateModal() {
		editingOption = null;
		masterValue = '';
		errorMessage = '';
		backendError = '';
		isValueTouched = false;
		isModalOpen = true;
	}

	function openEditModal(id: string) {
		const option = options.find((item) => item.id === id);
		if (!option) return;
		editingOption = option;
		masterValue = option.label;
		errorMessage = '';
		backendError = '';
		isValueTouched = false;
		isModalOpen = true;
	}

	async function saveMasterValue(event: Event) {
		event.preventDefault();
		isValueTouched = true;
		const currentError = getValidationError(masterValue);
		if (currentError) {
			masterInput?.focus();
			return;
		}

		isSubmitting = true;
		errorMessage = '';
		try {
			const response = await fetch(
				editingOption
					? `/api/master-data/${master}/${editingOption.id}`
					: `/api/master-data/${master}`,
				{
					method: editingOption ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: masterValue.trim(), country_cuid: countryCuid })
				}
			);
			const body = await response.json();
			if (response.ok) {
				await loadOptions();
				if (!editingOption && body.data?.cuid) {
					onSelect(body.data.cuid);
				}
				isModalOpen = false;
			} else if (response.status === 409 && body.field === 'name') {
				backendError = body.error;
				masterInput?.focus();
			} else {
				errorMessage = body.error || `Unable to save ${config.label.toLowerCase()}.`;
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-2">
	<SearchableDropdown
		label={label ?? config.label}
		{options}
		{value}
		{multiple}
		{placeholder}
		{permissions}
		{onSelect}
		onAdd={permissions.canCreate ? openCreateModal : undefined}
		onEdit={permissions.canEdit ? openEditModal : undefined}
	/>
	{#if isLoading}
		<p class="text-xs text-muted-foreground">Loading {config.label.toLowerCase()} options...</p>
	{/if}
	{#if errorMessage && !isModalOpen}
		<Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>
	{/if}
</div>

<CrudModal
	open={isModalOpen}
	title={editingOption ? `Edit ${config.label}` : `Add ${config.label}`}
	description="Master values are validated on the frontend and again in the service layer."
	onClose={() => (isModalOpen = false)}
>
	{#snippet children({ cancel })}
		<form class="space-y-4" onsubmit={saveMasterValue}>
			<div class="space-y-2">
				<Label for={`${master}_value`}>{config.label}</Label>
				<Input
					id={`${master}_value`}
					bind:ref={masterInput}
					bind:value={masterValue}
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
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingOption ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>
