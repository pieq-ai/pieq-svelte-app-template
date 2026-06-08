<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '$lib/components/index.js';

	interface Props {
		value: 'all' | boolean;
		onChange: (value: 'all' | boolean) => void;
	}

	let { value, onChange }: Props = $props();

	let displayValue = $derived(value === 'all' ? 'All' : value === true ? 'Active' : 'Inactive');
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button variant="outline" class="h-9 w-[180px] justify-between border-input bg-background shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none" {...props}>
				{displayValue}
				<FilterIcon class="ml-2 size-4 opacity-50" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-[180px]">
		<DropdownMenu.Group>
			<DropdownMenu.Item onclick={() => onChange('all')} class="justify-between cursor-pointer {value === 'all' ? 'bg-accent text-accent-foreground' : ''}">
				All
				{#if value === 'all'}<CheckIcon class="size-4" />{/if}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => onChange(true)} class="justify-between cursor-pointer {value === true ? 'bg-accent text-accent-foreground' : ''}">
				Active
				{#if value === true}<CheckIcon class="size-4" />{/if}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => onChange(false)} class="justify-between cursor-pointer {value === false ? 'bg-accent text-accent-foreground' : ''}">
				Inactive
				{#if value === false}<CheckIcon class="size-4" />{/if}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
