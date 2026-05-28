<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { toast } from '$lib/toast.svelte';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import InfoIcon from '@lucide/svelte/icons/info';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import XIcon from '@lucide/svelte/icons/x';
</script>

<div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
	{#each toast.list as item (item.id)}
		<div
			animate:flip={{ duration: 200 }}
			in:fly={{ y: 20, opacity: 0, duration: 250 }}
			out:fly={{ x: 100, opacity: 0, duration: 150 }}
			class="pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300
				{item.type === 'success' ? 'bg-[#ECFDF5]/90 border-emerald-200 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-50' : ''}
				{item.type === 'error' ? 'bg-[#FEF2F2]/90 border-red-200 text-red-950 dark:bg-red-950/90 dark:border-red-800 dark:text-red-50' : ''}
				{item.type === 'warning' ? 'bg-[#FFFBEB]/90 border-amber-200 text-amber-950 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-50' : ''}
				{item.type === 'info' ? 'bg-slate-50/90 border-slate-200 text-slate-900 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-50' : ''}"
			role="alert"
		>
			<span class="mt-0.5 shrink-0">
				{#if item.type === 'success'}
					<CheckCircleIcon class="size-5 text-emerald-600 dark:text-emerald-400" />
				{:else if item.type === 'error'}
					<AlertCircleIcon class="size-5 text-red-600 dark:text-red-400" />
				{:else if item.type === 'warning'}
					<AlertTriangleIcon class="size-5 text-amber-600 dark:text-amber-400" />
				{:else}
					<InfoIcon class="size-5 text-slate-500 dark:text-slate-400" />
				{/if}
			</span>

			<div class="flex-1 text-sm font-semibold leading-snug">
				{item.message}
			</div>

			<button
				type="button"
				onclick={() => toast.dismiss(item.id)}
				class="shrink-0 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-opacity"
				aria-label="Close notification"
			>
				<XIcon class="size-4" />
			</button>
		</div>
	{/each}
</div>
