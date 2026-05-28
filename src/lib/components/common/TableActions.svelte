<script lang="ts">
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components';

	interface Props {
		editLabel?: string;
		deleteLabel?: string;
		canEdit?: boolean;
		canDelete?: boolean;
		onEdit?: () => void;
		onDelete?: () => void;
	}

	let {
		editLabel = 'Edit',
		deleteLabel = 'Deactivate',
		canEdit = true,
		canDelete = true,
		onEdit,
		onDelete
	}: Props = $props();
</script>

<div class="flex items-center justify-end gap-1.5">
	{#if canEdit}
		<Button
			size="icon-sm"
			variant="ghost"
			class="h-7 w-7 text-muted-foreground hover:text-foreground"
			aria-label={editLabel}
			onclick={onEdit}
		>
			<PencilIcon class="size-3.5" />
		</Button>
	{/if}
	{#if canDelete}
		<Button
			size="icon-sm"
			variant="ghost"
			class="h-7 w-7 text-muted-foreground hover:text-destructive"
			aria-label={deleteLabel}
			onclick={onDelete}
		>
			<Trash2Icon class="size-3.5" />
		</Button>
	{/if}
</div>
