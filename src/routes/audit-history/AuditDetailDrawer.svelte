<script lang="ts">
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import { CrudModal } from '$lib/components';
	import AuditStatusBadge from './AuditStatusBadge.svelte';

	interface Props {
		open: boolean;
		loading: boolean;
		log: any;
		onClose: () => void;
	}

	let { open, loading, log, onClose }: Props = $props();

	function formatValue(val: any): string {
		if (val?.value === undefined) return '-';
		if (typeof val.value === 'object') return JSON.stringify(val.value, null, 2);
		return String(val.value);
	}
</script>

<CrudModal
	open={open}
	title="Audit Log Details"
	centered={false}
	onClose={onClose}
>
	{#if loading}
		<div class="flex h-[300px] flex-col items-center justify-center text-muted-foreground">
			<LoaderCircleIcon class="mb-2 size-8 animate-spin" />
			Loading audit details...
		</div>
	{:else if log}
		<div class="space-y-6 text-sm pb-8">
			<div>
				<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Context Metadata</h3>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-muted/30 p-4 rounded-lg border border-border font-mono text-xs">
					<span class="text-muted-foreground">Timestamp:</span>
					<span class="font-semibold">{new Date(log.created_at).toLocaleString()}</span>

					<span class="text-muted-foreground">Updated By:</span>
					<span class="font-semibold break-all">{log.performed_by || '-'}</span>
				</div>
			</div>

			<div>
				<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Operation Target</h3>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-muted/30 p-4 rounded-lg border border-border">
					<span class="text-muted-foreground">Entity:</span>
					<span class="font-semibold">{log.entity_name}</span>

					<span class="text-muted-foreground">Target CUID:</span>
					<span class="font-mono text-xs font-semibold text-[11px] break-all">{log.entity_cuid}</span>

					<span class="text-muted-foreground">Action Type:</span>
					<span class="font-semibold capitalize">{log.action_type}</span>

					<span class="text-muted-foreground">Status:</span>
					<span><AuditStatusBadge status={log.status} /></span>
				</div>
			</div>

			{#if log.field_name}
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Field Changes</h3>
					<div class="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border font-mono text-xs">
						<span class="text-muted-foreground col-span-2">
							Modified Field: <span class="text-foreground font-bold">{log.field_name}</span>
						</span>

						<div class="space-y-1">
							<span class="text-xs text-muted-foreground">Previous Value:</span>
							<div class="bg-card p-2 rounded border border-border max-h-[250px] overflow-auto whitespace-pre-wrap break-all text-[11px]">
								{formatValue(log.old_value)}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-xs text-muted-foreground">New Value:</span>
							<div class="bg-card p-2 rounded border border-border max-h-[250px] overflow-auto whitespace-pre-wrap break-all text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
								{formatValue(log.new_value)}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</CrudModal>
