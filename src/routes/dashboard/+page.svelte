<script lang="ts">
	import UserCircleIcon from '@lucide/svelte/icons/user-circle';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard – PieQ HRMS</title>
</svelte:head>

<!-- Page header -->
<div class="page-topbar" style="margin-bottom:24px">
	<div>
		<span
			style="display:inline-block;background:#C2652A1a;color:#C2652A;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border-radius:99px;margin-bottom:6px"
		>Overview</span>
		<h1 style="font-size:26px;font-weight:700;color:var(--foreground);margin:0;line-height:1.2">
			Dashboard
		</h1>
		<p style="color:var(--muted-foreground);font-size:13px;margin-top:4px">
			Welcome back, {data.context.user.name ?? data.context.user.email}
		</p>
	</div>
</div>

<!-- Stats strip -->
<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
	<div class="stat-card" style="border-left:3px solid #C2652A">
		<div class="stat-card-label">Assigned Roles</div>
		<div class="stat-card-value" style="font-size:28px">{data.context.stats.roleCount}</div>
	</div>
	<div class="stat-card">
		<div class="stat-card-label">Member Since</div>
		<div style="font-size:18px;font-weight:700;color:var(--foreground)">{data.context.stats.memberSince}</div>
	</div>
</div>

<!-- Cards grid -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:4px">

	<!-- Profile card -->
	<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)">
		<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
			<UserCircleIcon size={18} style="color:#C2652A" />
			<span style="font-size:14px;font-weight:700;color:var(--foreground)">Profile</span>
		</div>
		<div style="padding:20px;display:flex;flex-direction:column;gap:14px">
			<dl style="display:flex;flex-direction:column;gap:12px">
				<div>
					<dt style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--muted-foreground);margin-bottom:3px">Name</dt>
					<dd style="font-size:14px;font-weight:600;color:var(--foreground);margin:0">{data.context.user.name ?? '—'}</dd>
				</div>
				<div>
					<dt style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--muted-foreground);margin-bottom:3px">Email</dt>
					<dd style="font-size:14px;color:var(--foreground);margin:0">{data.context.user.email}</dd>
				</div>
				<div>
					<dt style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--muted-foreground);margin-bottom:3px">Member Since</dt>
					<dd style="font-size:14px;color:var(--foreground);margin:0">{data.context.stats.memberSince}</dd>
				</div>
			</dl>
		</div>
	</div>

	<!-- Roles card -->
	<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)">
		<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
			<ShieldIcon size={18} style="color:#C2652A" />
			<span style="font-size:14px;font-weight:700;color:var(--foreground)">Assigned Roles</span>
		</div>
		<div style="padding:20px">
			{#if data.context.roles.length > 0}
				<div style="display:flex;flex-wrap:wrap;gap:8px">
					{#each data.context.roles as role (role)}
						<span style="display:inline-flex;align-items:center;padding:4px 12px;background:#C2652A18;color:#C2652A;border-radius:99px;font-size:12px;font-weight:600">{role}</span>
					{/each}
				</div>
			{:else}
				<p style="font-size:13px;color:var(--muted-foreground);margin:0">No realm roles assigned.</p>
			{/if}
			<p style="font-size:12px;color:var(--muted-foreground);margin-top:16px">Total: {data.context.stats.roleCount} role{data.context.stats.roleCount !== 1 ? 's' : ''}</p>
		</div>
	</div>
</div>

{#if data.showAdminSection}
	<div style="margin-top:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)">
		<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
			<ShieldIcon size={18} style="color:#8C3C3C" />
			<span style="font-size:14px;font-weight:700;color:var(--foreground)">Admin</span>
			<span style="padding:2px 8px;background:#8C3C3C20;color:#8C3C3C;border-radius:99px;font-size:10px;font-weight:700;text-transform:uppercase">Restricted</span>
		</div>
		<div style="padding:20px">
			<p style="font-size:13px;color:var(--muted-foreground);margin:0">
				Visible only when the Keycloak token includes the <code style="background:var(--muted);padding:1px 6px;border-radius:4px;font-size:12px">admin</code> role.
			</p>
		</div>
	</div>
{/if}
