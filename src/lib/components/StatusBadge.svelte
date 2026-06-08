<script lang="ts">
	import { Badge } from '$lib/components';

	let { is_active }: { is_active: boolean } = $props();
</script>

{#if is_active}
	<Badge class="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-2.5 py-0.5 font-medium transition-colors">
		Active
	</Badge>
{:else}
	<Badge class="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20 px-2.5 py-0.5 font-medium transition-colors" variant="secondary">
		Inactive
	</Badge>
{/if}
