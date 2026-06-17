<script lang="ts">
	import { Button } from '$lib/components';
	import CrudModal from './CrudModal.svelte';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		cancelLabel?: string;
		confirmLabel?: string;
		isSubmitting?: boolean;
		onCancel: () => void;
		onConfirm: () => void;
	}

	let {
		open,
		title,
		description,
		cancelLabel = 'Cancel',
		confirmLabel = 'Confirm',
		isSubmitting = false,
		onCancel,
		onConfirm
	}: Props = $props();

</script>

<CrudModal {open} {title} {description} onClose={onCancel}>
	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={onCancel} disabled={isSubmitting}>{cancelLabel}</Button>
		<Button
			type="button"
			class="bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger/50 focus-visible:border-danger"
			onclick={onConfirm}
			disabled={isSubmitting}
		>
			{confirmLabel}
		</Button>
	</div>
</CrudModal>
