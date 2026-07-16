<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Label } from '$lib/components';
	import FilterDropdown from './FilterDropdown.svelte';

	interface Props {
		value: boolean;
		onChange: (val: boolean) => void;
		id?: string;
		name?: string;
		error?: string;
		onBlur?: () => void;
	}

	let { value, onChange, id = 'status', name = 'status', error = "", onBlur }: Props = $props();

	const statusOptions = [
		{ label: 'Active', value: true },
		{ label: 'Inactive', value: false }
	];
</script>

<div class="space-y-2">
	<Label for={id} class={error ? "text-destructive" : ""}>Status</Label>
	<FilterDropdown
		{value}
		options={statusOptions}
		onChange={(val) => onChange(val as boolean)}
		{id}
		{name}
		triggerClass="w-full"
		Icon={ChevronDownIcon}
		{error}
		{onBlur}
	/>
</div>
