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
		Showing {start} to {end} of {totalItems} entries
	</div>

	<!-- Pagination Controls -->
	<div class="flex items-center gap-2" data-slot="pagination">
		<Button
			variant="outline"
			class="px-3.5 py-1.5 h-8 bg-card border-border text-foreground hover:bg-accent text-xs font-medium rounded-md select-none"
			disabled={currentPage === 1}
			onclick={() => setPage(currentPage - 1)}
		>
			Previous
		</Button>
		<span class="text-xs text-muted-foreground select-none px-2 min-w-[70px] text-center">
			Page {currentPage} of {totalPages}
		</span>
		<Button
			variant="outline"
			class="px-3.5 py-1.5 h-8 bg-card border-border text-foreground hover:bg-accent text-xs font-medium rounded-md select-none"
			disabled={currentPage === totalPages}
			onclick={() => setPage(currentPage + 1)}
		>
			Next
		</Button>
	</div>
</div>
