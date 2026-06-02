<!-- src/lib/components/ToastContainer.svelte -->
<script lang="ts">
	import { toast } from '$lib/toast.svelte.js';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import XIcon from '@lucide/svelte/icons/x';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import InfoIcon from '@lucide/svelte/icons/info';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
</script>

<div class="toast-container" aria-live="polite" aria-instant="true">
	{#each toast.toasts as t (t.id)}
		<div
			class="toast-item {t.type}"
			transition:fly={{ y: 20, duration: 250 }}
			animate:flip={{ duration: 200 }}
		>
			<span class="toast-icon">
				{#if t.type === 'success'}
					<div class="toast-icon-badge success">
						<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
					</div>
				{:else}
					<div class="toast-icon-badge secondary">
						{#if t.type === 'error'}
							<AlertCircleIcon size={12} />
						{:else if t.type === 'warning'}
							<AlertTriangleIcon size={12} />
						{:else}
							<InfoIcon size={12} />
						{/if}
					</div>
				{/if}
			</span>

			<p class="toast-message">{t.message}</p>

			<button
				onclick={() => toast.dismiss(t.id)}
				class="toast-close"
				aria-label="Dismiss toast"
			>
				<XIcon size={14} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 24px;
		right: 24px;
		z-index: 300;
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 380px;
		width: calc(100vw - 48px);
		pointer-events: none;
	}

	.toast-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		background: #ffffff;
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
		pointer-events: auto;
		user-select: none;
		position: relative;
		overflow: hidden;
	}

	.toast-message {
		font-size: 13px;
		font-weight: 600;
		color: #18181b;
		margin: 0;
		line-height: 1.4;
		flex: 1;
		padding-right: 12px;
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.toast-icon-badge {
		background: #18181b;
		color: #ffffff;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.toast-icon-badge.secondary {
		background: #800020;
	}

	.toast-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted-foreground);
		padding: 2px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.15s, color 0.15s;
	}

	.toast-close:hover {
		background-color: var(--muted);
		color: var(--foreground);
	}
</style>
