<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Button } from '$lib/components';

	let {
		page = $bindable(1),
		totalPages = 1,
		total = 0,
		pageSize = 10
	}: {
		page: number;
		totalPages: number;
		total: number;
		pageSize: number;
	} = $props();

	let startEntry = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	let endEntry = $derived(Math.min(page * pageSize, total));
</script>

<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
	<p class="text-sm text-slate-500 font-medium">
		Showing <span class="text-slate-800 dark:text-slate-200 font-semibold">{startEntry}</span> to
		<span class="text-slate-800 dark:text-slate-200 font-semibold">{endEntry}</span> of
		<span class="text-slate-800 dark:text-slate-200 font-semibold">{total}</span> entries
	</p>

	<div class="flex items-center gap-2">
		<Button
			variant="outline"
			size="sm"
			class="h-9 px-3 hover:bg-slate-50 border-slate-200 font-medium transition-colors"
			disabled={page <= 1}
			onclick={() => (page = page - 1)}
		>
			<ChevronLeftIcon class="mr-1.5 size-4" />
			Previous
		</Button>

		<div class="flex items-center gap-1">
			{#each Array.from({ length: totalPages }, (_, i) => i + 1) as pageNum (pageNum)}
				{#if totalPages <= 5 || pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - page) <= 1}
					<Button
						variant={page === pageNum ? 'default' : 'outline'}
						size="sm"
						class="h-9 w-9 p-0 font-semibold transition-all duration-200 {page === pageNum ? 'shadow-sm shadow-primary/20' : 'hover:bg-slate-50 border-slate-200'}"
						onclick={() => (page = pageNum)}
					>
						{pageNum}
					</Button>
				{:else}
					<!-- Render ellipsis if distance is exactly 2 to avoid clutter -->
					{#if Math.abs(pageNum - page) === 2}
						<span class="text-slate-400 px-1 font-semibold">...</span>
					{/if}
				{/if}
			{/each}
		</div>

		<Button
			variant="outline"
			size="sm"
			class="h-9 px-3 hover:bg-slate-50 border-slate-200 font-medium transition-colors"
			disabled={page >= totalPages}
			onclick={() => (page = page + 1)}
		>
			Next
			<ChevronRightIcon class="ml-1.5 size-4" />
		</Button>
	</div>
</div>
