<script lang="ts">
	import { Button } from '$lib/components';
	import CrudModal from './CrudModal.svelte';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		isSubmitting?: boolean;
		onCancel: () => void;
		onConfirm: () => void;
	}

	let {
		open,
		title,
		description,
		confirmLabel = 'Confirm',
		isSubmitting = false,
		onCancel,
		onConfirm
	}: Props = $props();
</script>

<CrudModal {open} {title} {description} onClose={onCancel} isConfirmation={true}>
	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={onCancel} disabled={isSubmitting}>Cancel</Button>
		<Button
			type="button"
			class="bg-[#800020] dark:bg-[#9e1a35] text-white hover:bg-[#800020]/90 dark:hover:bg-[#9e1a35]/90 focus-visible:ring-[#800020]/50 dark:focus-visible:ring-[#9e1a35]/50 focus-visible:border-[#800020] dark:focus-visible:border-[#9e1a35]"
			onclick={onConfirm}
			disabled={isSubmitting}
		>
			{confirmLabel}
		</Button>
	</div>
</CrudModal>
