<script lang="ts">
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import AwardIcon from '@lucide/svelte/icons/award';

	let { events = [] } = $props<{ events: any[] }>();

	function getEventMonthName(dateStr: string | Date): string {
		const d = new Date(dateStr);
		return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
	}

	function getEventDay(dateStr: string | Date): string {
		const d = new Date(dateStr);
		return String(d.getDate()).padStart(2, '0');
	}
</script>

<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs w-full">
	<div class="flex items-center justify-between mb-5">
		<h3 class="text-lg font-bold text-neutral-900">Holiday Calendar</h3>
		<a
			href="/holidays"
			class="text-xs font-bold text-[#F45310] hover:underline decoration-none"
		>
			View Calendar
		</a>
	</div>
	<div class="flex flex-col gap-4">
		{#each events as event}
			<div class="flex items-center justify-between py-1 first:pt-0 last:pb-0">
				<div class="flex items-center gap-4">
					<!-- Left side: Date badge in a soft red background -->
					<div class="bg-[#FFF0EB] border border-[#FFE2D3] rounded-xl px-2.5 py-1.5 text-center flex flex-col items-center justify-center min-w-[50px]">
						<span class="text-[9px] font-extrabold text-[#F45310] leading-none uppercase">{getEventMonthName(event.date)}</span>
						<span class="text-base font-extrabold text-[#F45310] leading-none mt-1">{getEventDay(event.date)}</span>
					</div>

					<!-- Middle description details -->
					<div class="space-y-0.5">
						<p class="text-sm font-bold text-neutral-800 leading-tight">{event.name}</p>
						<p class="text-[11px] font-semibold text-neutral-400 tracking-wide">{event.holidayType || event.label}</p>
					</div>
				</div>

				<!-- Right side icon -->
				<div class="text-neutral-300">
					{#if event.type === 'holiday'}
						<Building2Icon class="size-5 text-[#FFE2D3]" />
					{:else if event.type === 'birthday'}
						<CakeIcon class="size-5 text-[#FFE2D3]" />
					{:else}
						<AwardIcon class="size-5 text-[#FFE2D3]" />
					{/if}
				</div>
			</div>
		{:else}
			<p class="text-xs font-semibold text-neutral-400 text-center py-4">No upcoming holidays scheduled.</p>
		{/each}
	</div>
</div>
