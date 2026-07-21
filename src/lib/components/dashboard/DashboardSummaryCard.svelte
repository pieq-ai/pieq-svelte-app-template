<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	let {
		value,
		label,
		Icon,
		valueColor = 'text-neutral-900',
		href,
		trend
	} = $props<{
		value: string | number | Snippet;
		label: string;
		Icon: Component<any>;
		valueColor?: string;
		href?: string;
		trend?: Snippet;
	}>();
</script>

{#if href}
	<a
		{href}
		class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs decoration-none cursor-pointer hover:border-neutral-300 transition-colors w-full"
	>
		<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
			<Icon class="size-5" />
		</div>
		<span class="text-3xl font-extrabold {valueColor} mt-3">
			{#if typeof value === 'function'}
				{@render value()}
			{:else}
				{value}
			{/if}
		</span>
		<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">{label}</span>
		{#if trend}
			{@render trend()}
		{/if}
	</a>
{:else}
	<div
		class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs w-full"
	>
		<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
			<Icon class="size-5" />
		</div>
		<span class="text-3xl font-extrabold {valueColor} mt-3">
			{#if typeof value === 'function'}
				{@render value()}
			{:else}
				{value}
			{/if}
		</span>
		<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">{label}</span>
		{#if trend}
			{@render trend()}
		{/if}
	</div>
{/if}
