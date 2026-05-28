<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert, AlertDescription, Button, CrudModal, Input, Label, SearchableDropdown } from '$lib/components';
	import { getMasterConfig, type MasterKey } from '$lib/master-data/master-config';
	import { getMasterPermissions, type MasterPermissionConfig } from '$lib/permissions/mock-permissions';
	import type { DropdownOption } from './SearchableDropdown.svelte';

	interface Props {
		master: MasterKey;
		label?: string;
		value: string;
		countryCuid2?: string;
		placeholder?: string;
		permissions?: Partial<MasterPermissionConfig>;
		onSelect: (id: string) => void;
	}

	let {
		master,
		label,
		value,
		countryCuid2,
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
	let isValueTouched = $state(false);

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
		if (master === 'states' && !countryCuid2) {
			return 'Select a country before adding a state';
		}
		return '';
	}

	let validationError = $derived(isValueTouched ? getValidationError(masterValue) : '');

	async function loadOptions() {
		isLoading = true;
		errorMessage = '';
		const query = countryCuid2 ? `?countryCuid2=${encodeURIComponent(countryCuid2)}` : '';
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
		isValueTouched = false;
		isModalOpen = true;
	}

	function openEditModal(id: string) {
		const option = options.find((item) => item.id === id);
		if (!option) return;
		editingOption = option;
		masterValue = option.label;
		errorMessage = '';
		isValueTouched = false;
		isModalOpen = true;
	}

	async function saveMasterValue(event: Event) {
		event.preventDefault();
		isValueTouched = true;
		const currentError = getValidationError(masterValue);
		if (currentError) {
			errorMessage = currentError;
			return;
		}

		isSubmitting = true;
		errorMessage = '';
		try {
			const response = await fetch(
				editingOption
					? `/api/master-data/${master}?cuid2=${editingOption.id}`
					: `/api/master-data/${master}`,
				{
					method: editingOption ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: masterValue.trim(), country_cuid2: countryCuid2 })
				}
			);
			const body = await response.json();
			if (response.ok) {
				if (editingOption) {
					options = options.map((option) => (option.id === editingOption?.id ? body.data : option));
				} else {
					options = [body.data, ...options];
					onSelect(body.data.id);
				}
				isModalOpen = false;
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
	onClose={() => (isModalOpen = false)}
>
	<form class="space-y-4" onsubmit={saveMasterValue}>
		<div class="space-y-2">
			<Label for={`${master}_value`}>{config.label}</Label>
			<Input
				id={`${master}_value`}
				bind:value={masterValue}
				class={validationError ? 'border-destructive' : ''}
				oninput={() => (isValueTouched = true)}
			/>
			{#if validationError}
				<p class="text-xs text-destructive">{validationError}</p>
			{/if}
		</div>

		{#if errorMessage}
			<Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>
		{/if}

		<Button type="submit" class="w-full bg-[#C2652A] text-white hover:bg-[#8C3C3C]" disabled={isSubmitting}>
			{isSubmitting ? 'Saving...' : 'Save'}
		</Button>
	</form>
</CrudModal>
