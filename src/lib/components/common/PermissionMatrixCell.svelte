<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	interface Props {
		checked: boolean;
		pending?: boolean;
		label: string;
		onToggle: () => void;
	}

	let { checked, pending = false, label, onToggle }: Props = $props();
</script>

<label
	class="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border transition hover:border-hrms-primary hover:bg-hrms-primary/10"
	class:border-hrms-primary={checked}
	class:bg-hrms-primary={checked}
	class:text-white={checked}
	class:border-border={!checked}
	class:bg-background={!checked}
	class:cursor-wait={pending}
	title={label}
>
	<span class="sr-only">{label}</span>
	<input
		type="checkbox"
		class="sr-only"
		checked={checked}
		disabled={pending}
		aria-label={label}
		onchange={onToggle}
	/>
	{#if pending}
		<LoaderCircleIcon class="size-4 animate-spin" />
	{:else if checked}
		<CheckIcon class="size-4" />
	{:else}
		<span class="h-0.5 w-3 rounded-full bg-hrms-neutral"></span>
	{/if}
</label>
