<script lang="ts">
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	interface Props {
		editLabel?: string;
		canEdit?: boolean;
		onEdit?: () => void;
		deleteLabel?: string;
		canDelete?: boolean;
		onDelete?: () => void;
	}

	let {
		editLabel = 'Edit',
		canEdit = true,
		onEdit,
		deleteLabel = 'Delete',
		canDelete = false,
		onDelete
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
				<PencilIcon class="mr-2 size-4" />
				{editLabel}
			</DropdownMenu.Item>
		{/if}
		{#if canDelete}
			<DropdownMenu.Item onclick={onDelete} class="cursor-pointer text-danger">
				<Trash2Icon class="mr-2 size-4" />
				{deleteLabel}
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
