<script lang="ts">
	import { slide } from 'svelte/transition';

	interface Option {
		id: number;
		label: string;
	}

	let {
		options = [],
		selectedIds = $bindable([]),
		placeholder = 'Select options...',
		name = 'selected_ids'
	}: {
		options: Option[];
		selectedIds: number[];
		placeholder?: string;
		name?: string;
	} = $props();

	let searchQuery = $state('');
	let isOpen = $state(false);
	let container: HTMLDivElement | null = $state(null);

	let filteredOptions = $derived.by(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return options;
		return options.filter((opt) => opt.label.toLowerCase().includes(query));
	});

	function toggleOption(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((x) => x !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function removeOption(id: number, e: MouseEvent) {
		e.stopPropagation();
		selectedIds = selectedIds.filter((x) => x !== id);
	}

	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (container && !container.contains(event.target as Node)) {
				isOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	let selectedOptions = $derived(
		options.filter((opt) => selectedIds.includes(opt.id))
	);
</script>

<div class="relative w-full" bind:this={container}>
	<!-- Hidden inputs to submit selected values in standard forms -->
	{#each selectedIds as id (id)}
		<input type="hidden" {name} value={id} />
	{/each}

	<!-- Input Trigger Box -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={() => (isOpen = !isOpen)}
		class="dark:bg-input/30 border-input min-h-9 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm shadow-xs transition-colors focus-within:border-input-focus focus-within:ring-input-focus-ring focus-within:ring-4 cursor-pointer flex flex-wrap gap-1.5 items-center justify-between"
	>
		{#if selectedOptions.length === 0}
			<span class="text-muted-foreground select-none">{placeholder}</span>
		{:else}
			<div class="flex flex-wrap gap-1">
				{#each selectedOptions as opt (opt.id)}
					<span class="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs font-medium px-2 py-0.5 rounded-sm">
						{opt.label}
						<button
							type="button"
							onclick={(e) => removeOption(opt.id, e)}
							class="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-full p-0.5 transition-colors cursor-pointer"
							title="Remove selection"
							aria-label="Remove selection"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
						</button>
					</span>
				{/each}
			</div>
		{/if}

		<div class="flex items-center gap-1">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"><path d="m6 9 6 6 6-6"/></svg>
		</div>
	</div>

	<!-- Dropdown Panel -->
	{#if isOpen}
		<div
			transition:slide={{ duration: 150 }}
			class="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none"
		>
			<!-- Search bar inside dropdown -->
			<div class="flex items-center border-b border-border px-3 py-2 bg-transparent">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 size-4 shrink-0 opacity-50"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"/></svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search..."
					class="flex h-7 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-accent mr-1 cursor-pointer"
						title="Clear search"
						aria-label="Clear search"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
					</button>
				{/if}
			</div>

			<!-- Options -->
			<div class="overflow-y-auto max-h-48 py-1">
				{#if filteredOptions.length === 0}
					<div class="px-2 py-1.5 text-xs text-muted-foreground text-center">
						No results found.
					</div>
				{:else}
					{#each filteredOptions as opt (opt.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							onclick={() => toggleOption(opt.id)}
							class="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
						>
							{#if selectedIds.includes(opt.id)}
								<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
								</span>
							{/if}
							<span>{opt.label}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
