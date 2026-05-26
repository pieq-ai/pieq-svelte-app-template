<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';

	type Variant = 'primary' | 'secondary' | 'ghost';
	type AppRoute = '/' | '/dashboard' | '/auth/signin';

	interface Props {
		type?: 'button' | 'submit' | 'reset';
		href?: AppRoute;
		variant?: Variant;
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		type = 'button',
		href,
		variant = 'primary',
		disabled = false,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

	const variants: Record<Variant, string> = {
		primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900',
		secondary:
			'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-slate-500',
		ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500'
	};

	const classes = $derived(`${base} ${variants[variant]} ${className}`);
</script>

{#if href}
	<a href={resolve(href)} class={classes} aria-disabled={disabled}>
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} {onclick} class={classes}>
		{@render children()}
	</button>
{/if}
