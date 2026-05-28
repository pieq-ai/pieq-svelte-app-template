<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		closeLabel?: string;
		onClose: () => void;
		children?: import('svelte').Snippet;
	}

	let { open, title, description = '', closeLabel = 'Close modal', onClose, children }: Props = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-[#262626]/70 px-4 py-6">
		<Card class="max-h-[90vh] w-full max-w-lg overflow-y-auto">
			<CardHeader class="flex-row items-start justify-between gap-4">
				<div class="space-y-1">
					<CardTitle>{title}</CardTitle>
					{#if description}
						<CardDescription>{description}</CardDescription>
					{/if}
				</div>
				<Button type="button" variant="ghost" size="icon-sm" aria-label={closeLabel} onclick={onClose}>
					<XIcon class="size-4" />
				</Button>
			</CardHeader>
			<CardContent>
				{@render children?.()}
			</CardContent>
		</Card>
	</div>
{/if}
