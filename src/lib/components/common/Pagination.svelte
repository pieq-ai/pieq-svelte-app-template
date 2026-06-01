<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Button } from '$lib/components';

	interface Props {
		currentPage: number;
		pageSize: number;
		totalItems: number;
	}

	let { currentPage = $bindable(), pageSize, totalItems }: Props = $props();

	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	
	let startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let endItem = $derived(Math.min(currentPage * pageSize, totalItems));

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}
	
	let visiblePages = $derived.by(() => {
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}
		if (currentPage <= 3) {
			return [1, 2, 3, 4, 5, '...', totalPages];
		}
		if (currentPage >= totalPages - 2) {
			return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
		}
		return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
	});
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
	<p class="text-sm text-muted-foreground">
		Showing {startItem}-{endItem} of {totalItems} record{totalItems === 1 ? '' : 's'}
	</p>
	<div class="flex items-center space-x-2">
		<Button 
			variant="outline" 
			size="sm" 
			class="h-8 gap-1 {currentPage === 1 || totalItems === 0 ? 'opacity-50 cursor-not-allowed text-muted-foreground' : ''}"
			disabled={currentPage === 1 || totalItems === 0}
			onclick={() => goToPage(currentPage - 1)}
		>
			<ChevronLeftIcon class="size-4" />
			<span>Previous</span>
		</Button>
		
		<div class="flex items-center gap-1">
			{#each visiblePages as page, i (i)}
				{#if page === '...'}
					<span class="px-2 text-sm text-muted-foreground">...</span>
				{:else}
					<Button 
						variant={currentPage === page ? "default" : "outline"} 
						size="icon-sm"
						class="h-8 w-8 {currentPage === page ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-foreground'}"
						onclick={() => goToPage(page as number)}
					>
						{page}
					</Button>
				{/if}
			{/each}
		</div>

		<Button 
			variant="outline" 
			size="sm" 
			class="h-8 gap-1 {currentPage >= totalPages || totalItems === 0 ? 'opacity-50 cursor-not-allowed text-muted-foreground' : ''}"
			disabled={currentPage >= totalPages || totalItems === 0}
			onclick={() => goToPage(currentPage + 1)}
		>
			<span>Next</span>
			<ChevronRightIcon class="size-4" />
		</Button>
	</div>
</div>
