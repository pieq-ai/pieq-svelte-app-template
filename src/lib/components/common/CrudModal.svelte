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
		<Card class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
			<CardHeader class="flex-col items-start gap-1 pr-12">
				<CardTitle>{title}</CardTitle>
				{#if description}
					<CardDescription>{description}</CardDescription>
				{/if}
			</CardHeader>
			<Button 
				type="button" 
				variant="ghost" 
				size="icon-sm" 
				class="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
				aria-label={closeLabel} 
				onclick={onClose}
			>
				<XIcon class="size-4" />
			</Button>
			<CardContent>
				{@render children?.()}
			</CardContent>
		</Card>
	</div>
{/if}
