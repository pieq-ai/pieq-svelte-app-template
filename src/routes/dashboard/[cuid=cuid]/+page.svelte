<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';

	let { data } = $props();
</script>

<svelte:head>
	<title>User {data.user.id}</title>
</svelte:head>

<Card>
	<CardHeader>
		<CardTitle>User detail</CardTitle>
	</CardHeader>
	<CardContent>
<<<<<<<< HEAD:src/routes/dashboard/[id=cuid]/+page.svelte
		<p class="text-sm text-muted-foreground">Route param validated with the <code>cuid</code> matcher.</p>
========
		<p class="text-sm text-muted-foreground">Route param validated before loading the detail view.</p>
>>>>>>>> main:src/routes/dashboard/[cuid=cuid]/+page.svelte
		<dl class="mt-4 space-y-3 text-sm">
			<div>
				<dt class="font-medium text-muted-foreground">ID</dt>
				<dd class="font-mono text-xs">{data.user.id}</dd>
			</div>
			<div>
				<dt class="font-medium text-muted-foreground">Email</dt>
				<dd>{data.user.email}</dd>
			</div>
		</dl>
	</CardContent>
</Card>
