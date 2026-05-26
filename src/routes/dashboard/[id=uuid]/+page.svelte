<script lang="ts">
	import { Card } from '$lib/components';

	let { data } = $props();
</script>

<svelte:head>
	<title>User {data.user.id}</title>
</svelte:head>

<Card title="User detail">
	<p class="text-sm text-slate-600">Route param validated with the <code>uuid</code> matcher.</p>
	<dl class="mt-4 space-y-3 text-sm">
		<div>
			<dt class="font-medium text-slate-500">ID</dt>
			<dd class="font-mono text-xs text-slate-900">{data.user.id}</dd>
		</div>
		<div>
			<dt class="font-medium text-slate-500">Email</dt>
			<dd class="text-slate-900">{data.user.email}</dd>
		</div>
	</dl>
</Card>
