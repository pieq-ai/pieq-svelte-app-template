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

<CrudModal {open} {title} {description} onClose={onCancel}>
	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={onCancel} disabled={isSubmitting}>Cancel</Button>
		<Button
			type="button"
			class="bg-[#8C3C3C] text-white hover:bg-[#8C3C3C]/90"
			onclick={onConfirm}
			disabled={isSubmitting}
		>
			{confirmLabel}
		</Button>
	</div>
</CrudModal>
