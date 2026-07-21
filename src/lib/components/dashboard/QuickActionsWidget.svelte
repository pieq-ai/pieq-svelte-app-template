<script lang="ts">
	import type { Component } from 'svelte';

	let { actions = [] } = $props<{
		actions: Array<{
			href?: string;
			label: string;
			Icon: Component<any>;
			disabled?: boolean;
		}>;
	}>();
</script>

<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs w-full">
	<h3 class="text-lg font-bold text-neutral-900 mb-5">Quick Actions</h3>
	<div class="grid grid-cols-4 gap-3">
		{#each actions as act}
			{#if act.disabled}
				<div class="flex flex-col items-center gap-2 group text-center cursor-not-allowed select-none opacity-50">
					<div class="size-12 rounded-2xl border border-neutral-100 flex items-center justify-center text-neutral-400 bg-white">
						<act.Icon class="size-5.5" />
					</div>
					<span class="text-[11px] font-bold text-neutral-400 leading-tight">{act.label}</span>
				</div>
			{:else}
				<a href={act.href} class="flex flex-col items-center gap-2 group text-center decoration-none">
					<div class="size-12 rounded-2xl border border-neutral-100 flex items-center justify-center text-neutral-600 bg-white group-hover:bg-[#FFF4EE] group-hover:border-[#FFE2D3] group-hover:text-[#F45310] transition-colors">
						<act.Icon class="size-5.5" />
					</div>
					<span class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors leading-tight">{act.label}</span>
				</a>
			{/if}
		{/each}
	</div>
</div>
