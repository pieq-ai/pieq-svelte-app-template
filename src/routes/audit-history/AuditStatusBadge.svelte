<script lang="ts">
	let { status }: { status: string } = $props();
</script>

{#if status === 'SUCCESS'}
	<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
		SUCCESS
	</span>
{:else if status === 'FAILED'}
	<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
		FAILED
	</span>
{:else}
	<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
		PARTIAL
	</span>
{/if}
