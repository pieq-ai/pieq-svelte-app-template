<script lang="ts">
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components';
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-4">
	<div class="space-y-1 border-b border-border pb-6">
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
	</div>
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<SettingsIcon class="size-5 text-[#F45310]" />
				Configuration
			</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground">Settings controls will be added as HRMS modules mature.</p>
		</CardContent>
	</Card>
</div>
