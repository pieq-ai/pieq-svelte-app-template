<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		status = true,
		class: className = ""
	}: {
		status: boolean;
		class?: string;
	} = $props();
</script>

{#if status}
	<span
		class={cn(
			"inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-950 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 shadow-xs select-none min-w-[70px] text-center",
			className
		)}
	>
		Active
	</span>
{:else}
	<span
		class={cn(
			"inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 shadow-xs select-none min-w-[70px] text-center",
			className
		)}
	>
		Inactive
	</span>
{/if}
