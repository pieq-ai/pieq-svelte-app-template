<script lang="ts">
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import BellIcon from '@lucide/svelte/icons/bell';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import PaletteIcon from '@lucide/svelte/icons/palette';
</script>

<svelte:head>
	<title>Settings – PieQ HRMS</title>
</svelte:head>

<div class="page-topbar">
	<div>
		<span
			style="display:inline-block;background:#F453101a;color:#F45310;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>System</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Settings
		</h1>
		<p style="color:var(--muted-foreground);font-size:13px;margin-top:4px">
			Manage system preferences and configurations.
		</p>
	</div>
</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:8px">
	{#each [
		{ icon: BellIcon, title: 'Notifications', desc: 'Configure alerts and notification preferences.', tag: 'Coming soon' },
		{ icon: ShieldIcon, title: 'Security', desc: 'Manage access control, sessions, and audit logs.', tag: 'Coming soon' },
		{ icon: PaletteIcon, title: 'Appearance', desc: 'Customize theme, colors, and display options.', tag: 'Coming soon' },
		{ icon: SettingsIcon, title: 'General', desc: 'Organization name, timezone, locale settings.', tag: 'Coming soon' }
	] as item}
		<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04)">
			<div style="display:flex;align-items:flex-start;justify-content:space-between">
				<div style="width:40px;height:40px;background:#F453101a;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#F45310">
					<item.icon size={20} />
				</div>
				<span style="font-size:10px;font-weight:600;padding:2px 8px;background:var(--muted);color:var(--muted-foreground);border-radius:99px;text-transform:uppercase;letter-spacing:.5px">{item.tag}</span>
			</div>
			<div>
				<h3 style="font-size:15px;font-weight:700;margin:0 0 4px;color:var(--foreground)">{item.title}</h3>
				<p style="font-size:13px;color:var(--muted-foreground);margin:0;line-height:1.5">{item.desc}</p>
			</div>
		</div>
	{/each}
</div>

<div style="margin-top:32px;padding:20px;background:var(--muted);border-radius:12px;border:1px solid var(--border)">
	<p style="font-size:13px;color:var(--muted-foreground);margin:0;text-align:center">
		Settings module is under active development. Check back in the next release.
	</p>
</div>
