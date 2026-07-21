<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		employee,
		customBadges = [],
		actions,
	} = $props<{
		employee: any;
		customBadges?: string[];
		actions?: Snippet;
	}>();

	const currentHour = new Date().getHours();
	const greeting = currentHour < 12 ? 'Good Morning' : (currentHour < 17 ? 'Good Afternoon' : 'Good Evening');
	
	const formattedTodayDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
</script>

<section class="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-[#FAF9F6]">
	<div class="space-y-3">
		<h2 class="text-4xl font-bold tracking-tight text-neutral-900">
			{greeting}, {employee?.first_name}
		</h2>
		<p class="text-sm font-medium text-neutral-500">{formattedTodayDate}</p>
		<div class="flex flex-wrap gap-2 pt-1">
			{#if employee?.emp_code}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
					ID: {employee.emp_code}
				</span>
			{/if}
			{#if employee?.department}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
					{employee.department}
				</span>
			{/if}
			{#if employee?.designation}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
					{employee.designation}
				</span>
			{/if}
			{#each customBadges as badge}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
					{badge}
				</span>
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-4 self-center md:self-start">
		{#if actions}
			{@render actions()}
		{/if}

		{#if employee?.reportingManager}
			<div class="bg-[#FFF4EE] border border-[#FFE2D3] rounded-2xl p-5 min-w-[240px] flex flex-col justify-center shadow-xs">
				<span class="text-xs font-semibold text-[#F45310] tracking-wider uppercase">Reporting Manager</span>
				<span class="text-base font-bold text-neutral-900 mt-1">{employee.reportingManager}</span>
			</div>
		{/if}
	</div>
</section>
