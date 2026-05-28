<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
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
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = key;
			sortOrder = 'asc';
		}
	}
</script>

<div class="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-card shadow-sm shadow-slate-100/50">
	<Table>
		<TableHeader class="bg-slate-50/50 dark:bg-slate-900/10">
			<TableRow class="hover:bg-transparent">
				{#each headers as header (header.key)}
					<TableHead class="text-slate-600 dark:text-slate-400 font-semibold py-2">
						{#if header.sortable && sortBy !== undefined && sortOrder !== undefined}
							<Button
								variant="ghost"
								size="sm"
								class="-ml-2.5 h-8 px-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
								onclick={() => handleSort(header.key)}
							>
								{header.label}
								{#if sortBy === header.key}
									{#if sortOrder === 'asc'}
										<ArrowUpIcon class="ml-1.5 size-3.5 text-primary" />
									{:else}
										<ArrowDownIcon class="ml-1.5 size-3.5 text-primary" />
									{/if}
								{:else}
									<ArrowUpDownIcon class="ml-1.5 size-3.5 opacity-40 hover:opacity-100" />
								{/if}
							</Button>
						{:else}
							{header.label}
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
