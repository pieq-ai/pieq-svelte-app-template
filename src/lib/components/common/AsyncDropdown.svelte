<script lang="ts">
	import { onMount } from 'svelte';
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
		apiEndpoint: string;
		onSelect: (id: string | string[]) => void;
	}

	let {
		label = 'Select',
		value,
		multiple = false,
		placeholder = 'Select option',
		permissions = getMasterPermissions(),
		disabled = false,
		class: className = '',
		apiEndpoint,
		onSelect
	}: Props = $props();

	let options = $state<{id: string; label: string}[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state('');

	async function loadOptions() {
		isLoading = true;
		errorMessage = '';
		try {
			const response = await fetch(apiEndpoint);
			const body = await response.json();
			if (response.ok) {
				options = (body.data ?? []).filter((d: any) => d.status || d.is_active || d.status === undefined).map((d: any) => ({ id: d.cuid, label: d.name }));
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
		{label}
		{value}
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
	{#if errorMessage}
		<Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>
	{/if}
</div>
