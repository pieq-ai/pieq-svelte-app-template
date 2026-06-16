<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button, Label } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	interface Props {
		value: boolean;
		onChange: (val: boolean) => void;
		id?: string;
		name?: string;
	}

	let { value, onChange, id = 'status', name = 'status' }: Props = $props();
</script>

<div class="space-y-2">
	<Label for={id}>Status</Label>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{id}
					{name}
					variant="outline"
					class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none"
					{...props}
				>
					{value ? 'Active' : 'Inactive'}
					<ChevronDownIcon class="ml-2 size-4 opacity-50" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Item
					onclick={() => onChange(true)}
					class="cursor-pointer flex items-center gap-2 {value === true ? 'font-medium text-[#F45310]' : ''}"
				>
					<CheckIcon class="size-4 shrink-0 {value === true ? 'opacity-100 text-[#F45310]' : 'opacity-0'}" />
					Active
				</DropdownMenu.Item>
				<DropdownMenu.Item
					onclick={() => onChange(false)}
					class="cursor-pointer flex items-center gap-2 {value === false ? 'font-medium text-[#F45310]' : ''}"
				>
					<CheckIcon class="size-4 shrink-0 {value === false ? 'opacity-100 text-[#F45310]' : 'opacity-0'}" />
					Inactive
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
