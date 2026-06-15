<script lang="ts">
	import { Button } from '$lib/components';
	import CrudModal from './CrudModal.svelte';

	interface Props {
		open: boolean;
		isSubmitting?: boolean;
		onSaveAndPrev: () => void;
		onDiscard: () => void;
		onCancel: () => void;
	}

	let { open, isSubmitting = false, onSaveAndPrev, onDiscard, onCancel }: Props = $props();
</script>

<CrudModal
	{open}
	title="Unsaved Changes"
	description="You have unsaved changes on this page. What would you like to do?"
	onClose={onCancel}
>
	<div class="flex flex-col sm:flex-row justify-end gap-2 pt-2">
		<Button type="button" variant="outline" onclick={onCancel} disabled={isSubmitting}>
			Cancel
		</Button>
		<Button
			type="button"
			variant="secondary"
			onclick={onDiscard}
			disabled={isSubmitting}
		>
			Discard Changes
		</Button>
		<Button
			type="button"
			onclick={onSaveAndPrev}
			disabled={isSubmitting}
		>
			{isSubmitting ? 'Saving...' : 'Save & Go Previous'}
		</Button>
	</div>
</CrudModal>
