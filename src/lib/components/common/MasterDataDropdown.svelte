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
		value: string;
		countryCuid?: string;
		placeholder?: string;
		permissions?: Partial<MasterPermissionConfig>;
		onSelect: (id: string) => void;
	}

	let {
		master,
		label,
		value,
		countryCuid,
		placeholder = 'Search or select...',
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
	let errors = $state<Record<string, string>>({});
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


	let isDirty = $derived(editingOption ? masterValue.trim() !== editingOption.label.trim() : masterValue.trim() !== '');

	let isSubmitDisabled = $derived.by(() => {
		if (isSubmitting) return true;
		if (!masterValue.trim()) return true;
		if (editingOption) {
			return !isDirty;
		}
		return false;
	});

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
		errors = {};
		isModalOpen = true;
	}

	function openEditModal(id: string) {
		const option = options.find((item) => item.id === id);
		if (!option) return;
		editingOption = option;
		masterValue = option.label;
		errorMessage = '';
		errors = {};
		isModalOpen = true;
	}

	async function saveMasterValue(event: Event) {
		event.preventDefault();
		const currentError = getValidationError(masterValue);
		if (currentError) {
			errors.master_value = currentError;
			masterInput?.focus();
			return;
		}

		isSubmitting = true;
		errorMessage = '';
		errors = {};
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
				errors.master_value = body.error;
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
	isDirty={isDirty}
	onClose={() => (isModalOpen = false)}
>
	{#snippet children({ cancel })}
		<form class="flex flex-col min-h-0 flex-1 overflow-hidden" onsubmit={saveMasterValue}>
			<div class="flex-1 overflow-y-auto pr-1 space-y-4 modal-scroll-area">
			<div class="space-y-2">
				<Label for={`${master}_value`} class={errors.master_value ? 'text-danger' : ''}>{config.label} <span class="text-destructive">*</span></Label>
				<Input
					id={`${master}_value`}
					bind:ref={masterInput}
					bind:value={masterValue}
					class={errors.master_value ? 'border-danger focus-visible:ring-danger/30' : ''}
					oninput={() => { errors.master_value = ''; }}
				/>
				{#if errors.master_value}
					<p class="text-xs font-medium text-danger mt-1">{errors.master_value}</p>
				{/if}
			</div>

			</div>

			<div class="flex items-center justify-end gap-3 pt-6 flex-shrink-0">
				<Button type="button" variant="outline" onclick={cancel}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
				<Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitDisabled}>
					{isSubmitting ? UI_CONSTANTS.BUTTON_SAVING : (editingOption ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
				</Button>
			</div>
		</form>
	{/snippet}
</CrudModal>
