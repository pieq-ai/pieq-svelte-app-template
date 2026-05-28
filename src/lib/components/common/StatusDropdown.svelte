<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button, Label } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	interface Props {
		value: boolean;
		onChange: (val: boolean) => void;
	}

	let { value, onChange }: Props = $props();
</script>

<div class="space-y-2">
	<Label>Status</Label>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-sm hover:bg-accent focus-visible:ring-1 focus-visible:ring-[#C2652A]"
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
					class="cursor-pointer justify-between {value === true ? 'bg-accent text-accent-foreground' : ''}"
				>
					Active
					{#if value === true}<CheckIcon class="size-4" />{/if}
				</DropdownMenu.Item>
				<DropdownMenu.Item
					onclick={() => onChange(false)}
					class="cursor-pointer justify-between {value === false ? 'bg-accent text-accent-foreground' : ''}"
				>
					Inactive
					{#if value === false}<CheckIcon class="size-4" />{/if}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
