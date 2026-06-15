<script lang="ts">
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Button } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	export interface CustomAction {
		label: string;
		onClick: () => void;
		icon?: any;
		class?: string;
	}

	interface Props {
		editLabel?: string;
		canEdit?: boolean;
		onEdit?: () => void;
		customActions?: CustomAction[];
		showIcons?: boolean;
	}

	let {
		editLabel = 'Edit',
		canEdit = true,
		onEdit,
		customActions = [],
		showIcons = true
	}: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-7 w-7 text-muted-foreground hover:text-foreground focus:border-ring focus:ring-ring/50 focus:ring-3 data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-3 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] outline-none"
				aria-label="Actions"
				{...props}
			>
				<MoreVerticalIcon class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" preventScroll={false}>
		{#if canEdit}
			<DropdownMenu.Item onclick={onEdit} class="cursor-pointer">
				{#if showIcons}
					<PencilIcon class="mr-2 size-4" />
				{/if}
				{editLabel}
			</DropdownMenu.Item>
		{/if}
		{#if customActions && customActions.length > 0}
			{#each customActions as action}
				<DropdownMenu.Item onclick={action.onClick} class="cursor-pointer {action.class || ''}">
					{#if showIcons && action.icon}
						{@const IconComponent = action.icon}
						<IconComponent class="mr-2 size-4" />
					{/if}
					{action.label}
				</DropdownMenu.Item>
			{/each}
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
