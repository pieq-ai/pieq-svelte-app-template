<script lang="ts">
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { Button } from '$lib/components';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import type { Snippet } from 'svelte';

	export interface TableAction {
		label: string;
		onClick: () => void;
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
		children?: Snippet;
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
		deleteLabel = 'Delete',
		children
	}: Props = $props();

	let finalActions = $derived.by(() => {
		const arr = [...actions, ...customActions];
		if (canView && onView) {
			arr.push({ label: viewLabel, onClick: onView });
		}
		if (canEdit && onEdit) {
			arr.push({ label: editLabel, onClick: onEdit });
		}
		if (canDelete && onDelete) {
			arr.push({ label: deleteLabel, onClick: onDelete, class: 'text-destructive focus:bg-destructive focus:text-destructive-foreground' });
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
				class="kebab-dropdown-menu h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-3 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:ring-ring/50 data-[state=open]:ring-3 transition-[color,box-shadow] outline-none"
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
				{action.label}
			</DropdownMenu.Item>
		{/each}
		{#if children}
			{@render children()}
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>