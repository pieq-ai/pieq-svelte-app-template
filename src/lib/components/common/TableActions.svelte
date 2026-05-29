<script lang="ts">
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Button } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	interface Props {
		editLabel?: string;
		canEdit?: boolean;
		onEdit?: () => void;
	}

	let {
		editLabel = 'Edit',
		canEdit = true,
		onEdit
	}: Props = $props();
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
	<DropdownMenu.Content align="end">
		{#if canEdit}
			<DropdownMenu.Item onclick={onEdit} class="cursor-pointer">
				<PencilIcon class="mr-2 size-4" />
				{editLabel}
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
