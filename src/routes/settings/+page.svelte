<script lang="ts">
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import BellIcon from '@lucide/svelte/icons/bell';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import PaletteIcon from '@lucide/svelte/icons/palette';
</script>

<svelte:head>
	<title>Settings – PieQ HRMS</title>
</svelte:head>

<div class="flex items-center justify-between mb-7">
	<div>
		<span
			class="inline-block bg-pieq-primary/10 text-pieq-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.75 rounded-full mb-1.5"
		>System</span>
		<h1 class="text-[26px] font-bold text-foreground m-0 leading-[1.2]">
			Settings
		</h1>
		<p class="text-[13px] text-muted-foreground mt-1">
			Manage system preferences and configurations.
		</p>
	</div>
</div>

<div class="grid gap-4 mt-2 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
	{#each [
		{ icon: BellIcon, title: 'Notifications', desc: 'Configure alerts and notification preferences.', tag: 'Coming soon' },
		{ icon: ShieldIcon, title: 'Security', desc: 'Manage access control, sessions, and audit logs.', tag: 'Coming soon' },
		{ icon: PaletteIcon, title: 'Appearance', desc: 'Customize theme, colors, and display options.', tag: 'Coming soon' },
		{ icon: SettingsIcon, title: 'General', desc: 'Organization name, timezone, locale settings.', tag: 'Coming soon' }
	] as item}
		<div class="bg-card border border-border rounded-xl p-6 flex flex-col gap-3.5 shadow-sm">
			<div class="flex items-start justify-between">
				<div class="w-10 h-10 bg-pieq-primary/10 rounded-lg flex items-center justify-center text-pieq-primary">
					<item.icon size={20} />
				</div>
				<span class="text-[10px] font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full uppercase tracking-wider">{item.tag}</span>
			</div>
			<div>
				<h3 class="text-[15px] font-bold mb-1 text-foreground">{item.title}</h3>
				<p class="text-[13px] text-muted-foreground m-0 leading-normal">{item.desc}</p>
			</div>
		</div>
	{/each}
</div>

<div class="mt-8 p-5 bg-muted rounded-xl border border-border">
	<p class="text-[13px] text-muted-foreground m-0 text-center">
		Settings module is under active development. Check back in the next release.
	</p>
</div>
