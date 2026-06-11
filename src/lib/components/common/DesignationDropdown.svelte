<script lang="ts">
	import { onMount } from 'svelte';
	import { UI_CONSTANTS } from '$lib/constants';
	import { Alert, AlertDescription, SearchableDropdown } from '$lib/components';
	import { getMasterPermissions, type MasterPermissionConfig } from '$lib/permissions/mock-permissions';

	interface Props {
		label?: string;
		value: string | string[];
		multiple?: boolean;
		placeholder?: string;
		permissions?: Partial<MasterPermissionConfig>;
		disabled?: boolean;
		class?: string;
		onSelect: (id: string | string[]) => void;
	}

	let {
		label = 'Designation',
		value,
		multiple = false,
		placeholder,
		permissions = getMasterPermissions(),
		disabled = false,
		class: className = '',
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
				options = (body.data ?? []).filter((d: any) => d.status).map((d: any) => ({ id: d.cuid, label: d.name }));
			} else {
				errorMessage = body.error || `Failed to load options.`;
			}
		} finally {
			isLoading = false;
		}
	}

	onMount(loadOptions);


</script>

<div class="space-y-2">
	<SearchableDropdown
		label={label}
		value={value}
		{options}
		{multiple}
		{placeholder}
		{disabled}
		class={className}
		{permissions}
		{onSelect}
	/>
	{#if isLoading}
		<p class="text-xs text-muted-foreground">Loading options...</p>
	{/if}
	{#if errorMessage && !isModalOpen}
		<Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>
	{/if}
</div>

