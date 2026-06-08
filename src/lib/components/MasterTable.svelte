<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import {
		Table,
		TableHeader,
		TableBody,
		TableRow,
		TableHead,
		TableCell
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
		emptyMessage = 'No records',
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
					<TableHead class="font-semibold py-2 {header.class || ''}">
						{#if header.sortable && sortBy !== undefined && sortOrder !== undefined}
							<button
								type="button"
								class="inline-flex items-center gap-1 font-semibold cursor-pointer select-none"
								onclick={() => handleSort(header.key)}
							>
								<span>{header.label}</span>
								<!-- Sort indicator: single icon per state -->
								<span class="inline-flex items-center">
									{#if sortBy !== header.key}
										<ArrowUpDownIcon class="size-3.5" />
									{:else if sortOrder === 'asc'}
										<ArrowUpIcon class="size-3.5" />
									{:else}
										<ArrowDownIcon class="size-3.5" />
									{/if}
								</span>
							</button>
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
						<p class="text-sm font-medium text-slate-500">{emptyMessage}</p>
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
