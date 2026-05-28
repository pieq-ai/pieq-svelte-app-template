<!-- src/lib/components/ToastContainer.svelte -->
<script lang="ts">
	import { toast } from '$lib/toast.svelte.js';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import XIcon from '@lucide/svelte/icons/x';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
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
					<CheckCircleIcon size={18} />
				{:else if t.type === 'error'}
					<AlertCircleIcon size={18} />
				{:else if t.type === 'warning'}
					<AlertTriangleIcon size={18} />
				{:else}
					<InfoIcon size={18} />
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
		align-items: flex-start;
		gap: 12px;
		padding: 14px 16px;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
		pointer-events: auto;
		user-select: none;
		position: relative;
		overflow: hidden;
	}

	.toast-message {
		font-size: 13px;
		font-weight: 500;
		color: var(--foreground);
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
		margin-top: 1px;
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
		align-self: flex-start;
	}

	.toast-close:hover {
		background-color: var(--muted);
		color: var(--foreground);
	}

	/* Success State */
	.toast-item.success {
		border-left: 4px solid #16a34a;
	}
	.toast-item.success .toast-icon {
		color: #16a34a;
	}

	/* Error State */
	.toast-item.error {
		border-left: 4px solid #dc2626;
	}
	.toast-item.error .toast-icon {
		color: #dc2626;
	}

	/* Warning State */
	.toast-item.warning {
		border-left: 4px solid #eab308;
	}
	.toast-item.warning .toast-icon {
		color: #eab308;
	}

	/* Info State */
	.toast-item.info {
		border-left: 4px solid var(--pieq-primary);
	}
	.toast-item.info .toast-icon {
		color: var(--pieq-primary);
	}
</style>
