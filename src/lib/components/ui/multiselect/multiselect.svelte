<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import PlusIcon from '@lucide/svelte/icons/plus';

	interface Option {
		id: string | number;
		label: string;
	}

	let {
		options = [],
		selectedIds = $bindable([]),
		placeholder = 'Select options...',
		name = 'selected_ids',
		searchQuery = $bindable(''),
		onAdd,
		addLabel = 'Add option',
		showAddIcon = true
	}: {
		options: Option[];
		selectedIds: (string | number)[];
		placeholder?: string;
		name?: string;
		searchQuery?: string;
		onAdd?: () => void;
		addLabel?: string;
		showAddIcon?: boolean;
	} = $props();
	let isOpen = $state(false);
	let container: HTMLDivElement | null = $state(null);

	let filteredOptions = $derived.by(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return options;
		return options.filter((opt) => opt.label.toLowerCase().includes(query));
	});

	function toggleOption(id: string | number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((x) => x !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function removeOption(id: string | number, e: MouseEvent) {
		e.stopPropagation();
		selectedIds = selectedIds.filter((x) => x !== id);
	}

	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (container && !container.contains(event.target as Node)) {
				isOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside, { capture: true });
		return () => {
			document.removeEventListener('click', handleClickOutside, { capture: true });
		};
	});

	let selectedOptions = $derived(
		options.filter((opt) => selectedIds.includes(opt.id))
	);

	let isAllSelected = $derived(
		filteredOptions.length > 0 &&
		filteredOptions.every((opt) => selectedIds.includes(opt.id))
	);

	function selectAll(e: MouseEvent) {
		e.stopPropagation();
		const newSelectedIds = [...selectedIds];
		for (const opt of filteredOptions) {
			if (!newSelectedIds.includes(opt.id)) {
				newSelectedIds.push(opt.id);
			}
		}
		selectedIds = newSelectedIds;
	}

	function deselectAll(e: MouseEvent) {
		e.stopPropagation();
		selectedIds = [];
	}
</script>

<div class="relative w-full" bind:this={container}>
	<!-- Hidden inputs to submit selected values in standard forms -->
	{#each selectedIds as id (id)}
		<input type="hidden" {name} value={id} />
	{/each}

	<!-- Input Trigger Box -->
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				isOpen = false;
			}
		}}
		class={cn(
			"flex items-center justify-between w-full h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-[color,box-shadow] hover:bg-accent/30 focus:border-ring focus:ring-ring/50 focus:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none cursor-pointer select-none text-left",
			isOpen && "border-ring ring-ring/50 ring-3"
		)}
	>
		<div class="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0 pr-2">
			{#if selectedOptions.length === 0}
				<span class="text-muted-foreground truncate select-none">{placeholder}</span>
			{:else}
				<div class="flex items-center gap-1.5 overflow-hidden min-w-0">
					{#if selectedOptions.length <= 2}
						{#each selectedOptions as opt (opt.id)}
							<span class="inline-flex items-center bg-hrms-secondary text-white dark:bg-neutral-200 dark:text-hrms-secondary text-xs font-medium px-2 py-0.5 rounded-sm border border-border/20 truncate max-w-[140px] select-none h-6">
								{opt.label}
							</span>
						{/each}
					{:else}
						<span class="inline-flex items-center bg-hrms-secondary text-white dark:bg-neutral-200 dark:text-hrms-secondary text-xs font-semibold px-2 py-0.5 rounded-sm border border-border/20 select-none h-6">
							{selectedOptions.length} selected
						</span>
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-1 shrink-0">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"><path d="m6 9 6 6 6-6"/></svg>
		</div>
	</button>

	<!-- Dropdown Panel -->
	{#if isOpen}
		<div
			transition:slide={{ duration: 150 }}
			class="absolute left-0 z-50 mt-1 w-full min-w-[120px] origin-top-right rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-hidden flex flex-col overflow-hidden py-1"
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

			<!-- Select / Deselect All Actions -->
			<div class="flex justify-between items-center border-b border-border px-3 py-2 bg-muted/5 text-xs select-none">
				<button
					type="button"
					class="px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
					onclick={selectAll}
					disabled={filteredOptions.length === 0 || isAllSelected}
				>
					Select All
				</button>
				<button
					type="button"
					class="px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
					onclick={deselectAll}
					disabled={selectedIds.length === 0}
				>
					Deselect All
				</button>
			</div>

			<!-- Options -->
			<div class="overflow-y-auto max-h-52 px-1 py-1">
				{#if filteredOptions.length === 0}
					<div class="px-2 py-1.5 text-xs text-muted-foreground text-center">
						No results found.
					</div>
				{:else}
					{#each filteredOptions as opt (opt.id)}
						{@const isSelected = selectedIds.includes(opt.id)}
						<button
							type="button"
							onclick={() => toggleOption(opt.id)}
							class={cn(
								"flex items-center justify-between w-full px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none rounded-md",
								isSelected && "bg-accent/50 text-accent-foreground font-medium"
							)}
						>
							<span class="truncate">{opt.label}</span>
							{#if isSelected}
								<CheckIcon class="size-4 shrink-0 text-hrms-primary dark:text-hrms-primary ml-2" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>

			{#if onAdd}
				<div class="border-t border-border p-1 bg-muted/20 mt-1">
					<button
						type="button"
						class="flex items-center justify-center gap-1.5 w-full rounded-sm px-2 py-1.5 text-xs font-medium border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none"
						onclick={(e) => {
							e.stopPropagation();
							onAdd();
						}}
					>
						{#if showAddIcon}
							<PlusIcon class="size-3.5" />
						{/if}
						{addLabel}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
