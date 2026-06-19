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
		loadingText?: string;
		errorText?: string;
		onSelect: (id: string | string[]) => void;
		onAdd?: () => void;
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
		loadingText = 'Loading options...',
		errorText,
		onSelect,
		onAdd
	}: Props = $props();

	let options = $state<{id: string; label: string}[]>([]);
	let isLoading = $state(false);
	let currentErrorMessage = $state('');

	export async function loadOptions() {
		isLoading = true;
		currentErrorMessage = '';
		try {
			const response = await fetch(apiEndpoint);
			const body = await response.json();
			if (response.ok) {
				options = (body.data ?? []).filter((d: any) => d.status || d.is_active || d.status === undefined).map((d: any) => ({ id: d.cuid, label: d.name }));
			} else {
				currentErrorMessage = errorText || body.error || `Failed to load options.`;
				console.error(`[AsyncDropdown] API Error for ${apiEndpoint}:`, body.error || body);
			}
		} catch (e) {
			currentErrorMessage = errorText || `Failed to load options.`;
			console.error(`[AsyncDropdown] Network Error for ${apiEndpoint}:`, e);
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
		{onAdd}
	/>
	{#if isLoading}
		<p class="text-xs text-muted-foreground">{loadingText}</p>
	{/if}
	{#if currentErrorMessage}
		<Alert variant="destructive"><AlertDescription>{currentErrorMessage}</AlertDescription></Alert>
	{/if}
</div>
