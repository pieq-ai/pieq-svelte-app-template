<script lang="ts">
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Button } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	export interface TableAction {
		label: string;
		onClick: () => void;
		icon?: any;
		class?: string;
		disabled?: boolean;
	}

	interface Props {
		actions?: TableAction[];
		customActions?: TableAction[];
		canView?: boolean;
		onView?: () => void;
		viewLabel?: string;
		canEdit?: boolean;
		onEdit?: () => void;
		editLabel?: string;
		canDelete?: boolean;
		onDelete?: () => void;
		deleteLabel?: string;
	}

	let { 
		actions = [],
		customActions = [],
		canView = false,
		onView,
		viewLabel = 'View',
		canEdit = false,
		onEdit,
		editLabel = 'Edit',
		canDelete = false,
		onDelete,
		deleteLabel = 'Delete'
	}: Props = $props();

	let finalActions = $derived.by(() => {
		const arr = [...actions, ...customActions];
		if (canView && onView) {
			arr.push({ label: viewLabel, onClick: onView, icon: FileTextIcon });
		}
		if (canEdit && onEdit) {
			arr.push({ label: editLabel, onClick: onEdit, icon: PencilIcon });
		}
		if (canDelete && onDelete) {
			arr.push({ label: deleteLabel, onClick: onDelete, icon: TrashIcon, class: 'text-destructive focus:bg-destructive focus:text-destructive-foreground' });
		}
		return arr;
	});
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
		{#each finalActions as action}
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