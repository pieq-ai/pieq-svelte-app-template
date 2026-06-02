<script lang="ts">
	import Button from '../button/button.svelte';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		totalItems = 0,
		pageSize = 10,
		currentPage = $bindable(1)
	}: {
		totalItems: number;
		pageSize?: number;
		currentPage: number;
	} = $props();

	let totalPages = $derived(Math.ceil(totalItems / pageSize) || 1);
	let start = $derived(totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let end = $derived(Math.min(currentPage * pageSize, totalItems));

	// Adjust page if it exceeds maximum pages due to filtering/deletions
	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});

	function setPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}
</script>

<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 text-sm text-muted-foreground border-t border-border mt-4 w-full">
	<!-- Record Counter -->
	<div class="select-none text-xs text-muted-foreground">
		{#if totalItems === 0}
			Showing 0-0 of 0 records
		{:else}
			Showing {start}-{end} of {totalItems} records
		{/if}
	</div>

	<!-- Pagination Controls -->
	<div class="flex items-center gap-1.5" data-slot="pagination">
		<Button
			variant="outline"
			class="px-3.5 py-1.5 h-8 bg-card border-border text-foreground hover:bg-accent text-xs font-semibold rounded-md select-none cursor-pointer"
			disabled={currentPage === 1}
			onclick={() => setPage(currentPage - 1)}
		>
			&lt; Previous
		</Button>

		{#each Array(totalPages) as _, i}
			{@const p = i + 1}
			<Button
				variant={currentPage === p ? "default" : "outline"}
				class={currentPage === p 
					? "h-8 w-8 p-0 bg-black text-white hover:bg-black/90 font-semibold rounded-md select-none border-black cursor-pointer"
					: "h-8 w-8 p-0 bg-card border-border text-foreground hover:bg-accent font-semibold rounded-md select-none cursor-pointer"}
				onclick={() => setPage(p)}
			>
				{p}
			</Button>
		{/each}

		<Button
			variant="outline"
			class="px-3.5 py-1.5 h-8 bg-card border-border text-foreground hover:bg-accent text-xs font-semibold rounded-md select-none cursor-pointer"
			disabled={currentPage === totalPages}
			onclick={() => setPage(currentPage + 1)}
		>
			Next &gt;
		</Button>
	</div>
</div>
