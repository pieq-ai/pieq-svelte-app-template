<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import {
		Table,
		TableHeader,
		TableBody,
		TableRow,
		TableHead,
		TableCell,
		Button
	} from '$lib/components';

	interface Header {
		key: string;
		label: string;
		sortable?: boolean;
		class?: string;
	}

	let {
		headers,
		items = [],
		isLoading = false,
		sortBy = $bindable(),
		sortOrder = $bindable(),
		itemSnippet,
		emptyMessage = 'No records found matching your criteria.',
		getKey = (item: T, i: number) => {
			if (item && typeof item === 'object') {
				if ('id' in item) return (item as { id: unknown }).id;
				if ('component_id' in item) return (item as { component_id: unknown }).component_id;
			}
			return i;
		}
	}: {
		headers: Header[];
		items: T[];
		isLoading?: boolean;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		itemSnippet: Snippet<[T]>;
		emptyMessage?: string;
		getKey?: (item: T, i: number) => unknown;
	} = $props();

	function handleSort(key: string) {
		if (sortBy === key) {
			if (sortOrder === 'asc') {
				sortOrder = 'desc';
			} else {
				// Third click: reset — clear active column, restore default
				sortBy = '';
				sortOrder = 'asc';
			}
		} else {
			sortBy = key;
			sortOrder = 'asc';
		}
	}
</script>

<div class="w-full overflow-x-auto">
	<Table>
		<TableHeader class="bg-slate-50/50 dark:bg-slate-900/10">
			<TableRow class="hover:bg-transparent">
				{#each headers as header (header.key)}
					<TableHead class="text-slate-600 dark:text-slate-400 font-semibold py-2 {header.class || ''}">
						{#if header.sortable && sortBy !== undefined && sortOrder !== undefined}
							<Button
								variant="ghost"
								size="sm"
								class="-ml-2 h-8 px-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold w-full flex items-center justify-between gap-2"
								onclick={() => handleSort(header.key)}
							>
								<span>{header.label}</span>
								<!-- Sort indicator: horizontal arrows, neutral, state-driven -->
								<span class="flex shrink-0 items-center">
									{#if sortBy !== header.key || sortOrder === 'asc'}
										<ArrowUpIcon class="size-3 opacity-50" />
									{/if}
									{#if sortBy !== header.key || sortOrder === 'desc'}
										<ArrowDownIcon class="size-3 opacity-50" />
									{/if}
								</span>
							</Button>
						{:else}
							<span class="px-0 py-1 inline-block">{header.label}</span>
						{/if}
					</TableHead>
				{/each}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if isLoading}
				<TableRow class="hover:bg-transparent">
					<TableCell colspan={headers.length} class="h-48 text-center text-slate-400">
						<div class="flex flex-col items-center justify-center gap-3">
							<LoaderCircleIcon class="size-8 animate-spin text-primary/80" />
							<span class="text-sm font-medium tracking-wide">Fetching master records...</span>
						</div>
					</TableCell>
				</TableRow>
			{:else if items.length === 0}
				<TableRow class="hover:bg-transparent">
					<TableCell colspan={headers.length} class="h-48 text-center text-slate-400">
						<div class="flex flex-col items-center justify-center gap-3 py-6">
							<div class="flex size-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100">
								<DatabaseIcon class="size-6" />
							</div>
							<p class="text-sm font-medium text-slate-500">{emptyMessage}</p>
						</div>
					</TableCell>
				</TableRow>
			{:else}
				{#each items as item, i (getKey(item, i))}
					{@render itemSnippet(item)}
				{/each}
			{/if}
		</TableBody>
	</Table>
</div>
