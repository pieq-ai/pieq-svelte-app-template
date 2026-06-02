<!-- src/lib/components/ConfirmationModal.svelte -->
<script lang="ts">
	import { confirmation } from '$lib/confirmation.svelte.js';
	import { fade, scale } from 'svelte/transition';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import XIcon from '@lucide/svelte/icons/x';

	let loading = $state(false);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && confirmation.show) {
			confirmation.onCancel();
		}
	}

	async function handleConfirm() {
		loading = true;
		try {
			await confirmation.onConfirm();
		} finally {
			loading = false;
		}
	}

	// Lock body scroll when confirmation is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (confirmation.show) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if confirmation.show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="confirmation-overlay"
		transition:fade={{ duration: 150 }}
		onclick={(e) => { if (e.target === e.currentTarget) confirmation.onCancel(); }}
	>
		<div
			class="confirmation-card"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			<div class="confirmation-header">
				<div class="header-left">
					{#if confirmation.isDestructive}
						<span class="warning-icon-badge">
							<AlertTriangleIcon size={18} />
						</span>
					{/if}
					<h3 id="confirm-title" class="confirmation-title-text">
						{confirmation.title}
					</h3>
				</div>
				<button
					onclick={confirmation.onCancel}
					class="confirmation-close-btn"
					aria-label="Close dialog"
					disabled={loading}
				>
					<XIcon size={16} />
				</button>
			</div>

			<div class="confirmation-body">
				<p class="confirmation-message">{confirmation.message}</p>
			</div>

			<div class="confirmation-footer">
				<button
					type="button"
					onclick={confirmation.onCancel}
					class="btn-cancel"
					disabled={loading}
				>
					{confirmation.cancelText}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="btn-confirm"
					class:destructive={confirmation.isDestructive}
					disabled={loading}
				>
					{#if loading}
						<LoaderCircleIcon class="animate-spin" size={14} />
					{/if}
					{confirmation.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.confirmation-overlay {
		position: fixed;
		inset: 0;
		z-index: 250;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 11, 10, 0.4);
		backdrop-filter: blur(8px);
	}

	.confirmation-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 14px;
		width: 100%;
		max-width: 400px;
		margin: 0 16px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.confirmation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 20px;
		border-bottom: 1px solid var(--border);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.warning-icon-badge {
		width: 32px;
		height: 32px;
		background: #fee2e2;
		color: #dc2626;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.confirmation-title-text {
		font-size: 16px;
		font-weight: 700;
		color: var(--foreground);
		margin: 0;
		line-height: 1.2;
	}

	.confirmation-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--muted-foreground);
		padding: 4px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.15s, color 0.15s;
	}

	.confirmation-close-btn:hover {
		background-color: var(--muted);
		color: var(--foreground);
	}

	.confirmation-body {
		padding: 20px;
	}

	.confirmation-message {
		font-size: 14px;
		color: var(--muted-foreground);
		margin: 0;
		line-height: 1.5;
	}

	.confirmation-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 14px 20px;
		background: var(--muted);
		border-top: 1px solid var(--border);
	}

	.btn-cancel {
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--card);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		color: var(--foreground);
		transition: background-color 0.15s;
	}

	.btn-cancel:hover:not(:disabled) {
		background-color: var(--muted);
	}

	.btn-cancel:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-confirm {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		border: none;
		background: var(--pieq-primary);
		color: white;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.btn-confirm:hover:not(:disabled) {
		background-color: #d4430c;
	}

	.btn-confirm.destructive {
		background: #800020;
	}

	.btn-confirm.destructive:hover:not(:disabled) {
		background: #600018;
	}

	.btn-confirm:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
