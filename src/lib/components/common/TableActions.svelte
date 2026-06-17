<script lang="ts">
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Button } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	export interface TableAction {
		label: string;
		onClick: () => void;
		icon?: any;
		class?: string;
		disabled?: boolean;
	}

	interface Props {
		actions?: TableAction[];
	}

	let { actions = [] }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-7 w-7 text-muted-foreground hover:text-foreground"
				aria-label="Actions"
				{...props}
			>
				<MoreVerticalIcon class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" preventScroll={false}>
		{#each actions as action}
			<DropdownMenu.Item
				onclick={action.onClick}
				disabled={action.disabled}
				class="cursor-pointer {action.class ?? ''}"
			>
				{#if action.icon}
					{@const Icon = action.icon}
					<Icon class="mr-2 size-4" />
				{/if}

				{action.label}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>