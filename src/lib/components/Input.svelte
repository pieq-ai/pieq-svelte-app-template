<script lang="ts">
	interface Props {
		id?: string;
		name?: string;
		label?: string;
		type?: string;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		id,
		name,
		label,
		type = 'text',
		value = $bindable(''),
		placeholder,
		disabled = false,
		class: className = ''
	}: Props = $props();
</script>

<div class="space-y-1">
	{#if label}
		<label for={id} class="block text-sm font-medium text-slate-700">{label}</label>
	{/if}
	<input
		{id}
		{name}
		{type}
		bind:value
		{placeholder}
		{disabled}
		class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 {className}"
	/>
</div>
