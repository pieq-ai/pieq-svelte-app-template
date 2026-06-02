<script lang="ts">
	import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui';
</script>

<svelte:head>
	<title>System Settings - PieQ HRMS</title>
</svelte:head>

<div class="w-full space-y-8 px-1 py-4">
	<div class="space-y-1 border-b border-border pb-6">
		<Badge variant="secondary" class="uppercase">Configuration</Badge>
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">System Settings</h1>
		<p class="text-muted-foreground">
			View and manage application parameters and system metadata.
		</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>System Information</CardTitle>
				<CardDescription>Details about the current environment build.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex justify-between border-b border-border pb-2">
					<span class="text-muted-foreground">Application Name</span>
					<span class="font-semibold text-primary">PieQ HRMS</span>
				</div>
				<div class="flex justify-between border-b border-border pb-2">
					<span class="text-muted-foreground">Version</span>
					<span class="font-mono text-sm">v0.0.1 (Alpha)</span>
				</div>
				<div class="flex justify-between border-b border-border pb-2">
					<span class="text-muted-foreground">Database Engine</span>
					<span class="font-semibold">PostgreSQL</span>
				</div>
				<div class="flex justify-between pb-2">
					<span class="text-muted-foreground">Framework</span>
					<span class="font-semibold">SvelteKit / Svelte 5</span>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Brand Color Scheme</CardTitle>
				<CardDescription>Registered system theme tokens.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center gap-4">
					<div class="size-8 rounded-full bg-primary shadow-inner"></div>
					<div class="flex-1">
						<div class="font-semibold">Primary (Brand Orange)</div>
						<div class="text-xs text-muted-foreground font-mono">#F45310</div>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<div class="size-8 rounded-full bg-secondary shadow-inner border border-border/20"></div>
					<div class="flex-1">
						<div class="font-semibold">Secondary (Charcoal)</div>
						<div class="text-xs text-muted-foreground font-mono">#262626</div>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<div class="size-8 rounded-full bg-tertiary shadow-inner"></div>
					<div class="flex-1">
						<div class="font-semibold">Tertiary (Burgundy)</div>
						<div class="text-xs text-muted-foreground font-mono">#8C3C3C</div>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<div class="size-8 rounded-full bg-neutral shadow-inner"></div>
					<div class="flex-1">
						<div class="font-semibold">Neutral (Muted Gray)</div>
						<div class="text-xs text-muted-foreground font-mono">#737373</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
