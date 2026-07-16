<script lang="ts">
	import type { Component } from 'svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '$lib/components/index.js';

	export interface FilterOption {
		label: string;
		value: any;
	}

	interface Props {
		value: any;
		options?: FilterOption[];
		onChange: (value: any) => void;
		id?: string;
		name?: string;
		triggerClass?: string;
		Icon?: Component<any> | any;
		allLabel?: string;
		error?: string;
		onBlur?: () => void;
	}

	let { 
		value, 
		onChange, 
		id, 
		name, 
		triggerClass = "w-[180px]", 
		Icon = FilterIcon,
		allLabel = 'All Status',
		error = "",
		onBlur,
		options = [
			{ label: allLabel, value: 'all' },
			{ label: 'Active', value: true },
			{ label: 'Inactive', value: false }
		]
	}: Props = $props();

	let selectedOption = $derived(
		options.find((option) => option.value === value)
	);

	let displayValue = $derived(
		selectedOption?.label ?? 'Select'
	);

	function scrollIntoView(node: HTMLElement, condition: boolean) {
		if (condition) {
			setTimeout(() => {
				const parent = node.closest('[role="menu"]') || node.closest('[role="group"]') || node.closest('.overflow-y-auto');
				if (parent) {
					node.scrollIntoView({ block: 'nearest', behavior: 'auto' });
				} else {
					node.scrollIntoView({ block: 'nearest', behavior: 'auto' });
				}
			}, 50);
		}
	}
</script>

<div>
<DropdownMenu.Root onOpenChange={(v) => { if (!v && onBlur) onBlur(); }}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button 
				{id}
				{name}
				variant="outline" 
				class="h-9 {triggerClass} justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none {error ? 'border-destructive focus-visible:ring-destructive/30' : ''}" 
				{...props}
			>
				<span class="truncate pr-2">{displayValue}</span>
				<Icon class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width) max-h-60 overflow-y-auto">
		<DropdownMenu.Group>
			{#each options as option}
				<DropdownMenu.Item
					onclick={() => onChange(option.value)}
					class="cursor-pointer flex items-center gap-2 justify-between transition-colors duration-150"
				>
					<div class="flex items-center gap-2">
						<CheckIcon
							class="size-4 shrink-0 {option.value === value
								? 'opacity-100 text-[#F45310]'
								: 'opacity-0'}"
						/>

						<span
							class="{option.value === value
								? 'font-medium text-[#F45310]'
								: ''}"
						>
							{option.label}
						</span>
					</div>
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
{#if error}
	<p class="text-xs font-medium text-destructive mt-1">{error}</p>
{/if}
</div>
