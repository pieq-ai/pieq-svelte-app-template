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

<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 text-sm text-muted-foreground border-t border-border mt-4">
	<!-- Record Counter -->
	<div>
		Showing {start}-{end} of {totalItems} records
	</div>

	<!-- Pagination Controls -->
	{#if totalPages > 1}
		<div class="flex items-center gap-1.5" data-slot="pagination">
			<Button
				variant="outline"
				size="icon-sm"
				disabled={currentPage === 1}
				onclick={() => setPage(currentPage - 1)}
				aria-label="Previous page"
			>
				<ChevronLeftIcon class="size-4" />
			</Button>

			{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
				<Button
					variant={currentPage === page ? "default" : "outline"}
					size="icon-sm"
					onclick={() => setPage(page)}
					aria-label="Page {page}"
				>
					{page}
				</Button>
			{/each}

			<Button
				variant="outline"
				size="icon-sm"
				disabled={currentPage === totalPages}
				onclick={() => setPage(currentPage + 1)}
				aria-label="Next page"
			>
				<ChevronRightIcon class="size-4" />
			</Button>
		</div>
	{/if}
</div>
