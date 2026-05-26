<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		class?: string;
		children: Snippet;
	}

	let { title, class: className = '', children }: Props = $props();
</script>

<section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm {className}">
	{#if title}
		<h2 class="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
	{/if}
	{@render children()}
</section>
