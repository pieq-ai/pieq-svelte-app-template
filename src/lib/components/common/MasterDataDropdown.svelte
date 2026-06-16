<script module lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import type { DropdownOption } from './SearchableDropdown.svelte';

	const masterCache = new SvelteMap<string, DropdownOption[]>();
	const pendingRequests = new SvelteMap<string, Promise<DropdownOption[]>>();
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { UI_CONSTANTS } from '$lib/constants';
	import { Alert, AlertDescription, Button, CrudModal, Input, Label, SearchableDropdown } from '$lib/components';
	import { getMasterConfig, type MasterKey } from '$lib/master-data/master-config';
	import { getMasterPermissions, type MasterPermissionConfig } from '$lib/permissions/mock-permissions';

	interface Props {
		master: MasterKey;
		label?: string;
		value: string | string[];
		multiple?: boolean;
		countryCuid?: string;
		placeholder?: string;
		permissions?: Partial<MasterPermissionConfig>;
		disabled?: boolean;
		class?: string;
		onSelect: (id: string | string[]) => void;
	}

	let {
		master,
		label,
		value,
		multiple = false,
		countryCuid,
		placeholder,
		permissions = getMasterPermissions(),
		disabled = false,
		class: className = '',
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
		const cacheKey = countryCuid ? `${master}-${countryCuid}` : master;

		if (masterCache.has(cacheKey)) {
			options = masterCache.get(cacheKey)!;
			return;
		}

		isLoading = true;
		errorMessage = '';

		if (pendingRequests.has(cacheKey)) {
			try {
				options = await pendingRequests.get(cacheKey)!;
			} catch {
				errorMessage = 'Failed to load options from pending request.';
			} finally {
				isLoading = false;
			}
			return;
		}

		const query = countryCuid ? `?countryCuid=${encodeURIComponent(countryCuid)}` : '';
		
		const fetchPromise = fetch(`/api/master-data/${master}${query}`).then(async (response) => {
			const body = await response.json();
			if (response.ok) {
				const data = body.data ?? [];
				masterCache.set(cacheKey, data);
				return data;
			} else {
				throw new Error(body.error || `Failed to load ${config.label.toLowerCase()} options.`);
			}
		});

		pendingRequests.set(cacheKey, fetchPromise);

		try {
			options = await fetchPromise;
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			pendingRequests.delete(cacheKey);
			isLoading = false;
		}
	}

	onMount(() => untrack(loadOptions));

	$effect(() => {
		const currentCountryCuid = countryCuid;
		untrack(() => {
			if (currentCountryCuid !== undefined) {
				loadOptions();
			}
		});
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
				const cacheKey = countryCuid ? `${master}-${countryCuid}` : master;
				masterCache.delete(cacheKey);

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
		{disabled}
		class={className}
		{permissions}
		onSelect={onSelect}
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
