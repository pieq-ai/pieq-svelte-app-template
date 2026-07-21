<script lang="ts">
	import ClockIcon from '@lucide/svelte/icons/clock';

	let { activeShift } = $props<{ activeShift: any }>();

	function formatShiftTime12h(dateStr: string | null | undefined): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return '—';
		let hours = d.getUTCHours();
		const minutes = String(d.getUTCMinutes()).padStart(2, '0');
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12;
		const hoursStr = String(hours).padStart(2, '0');
		return `${hoursStr}:${minutes} ${ampm}`;
	}
</script>

<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs w-full">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-bold text-neutral-900">Shift Details</h3>
		<div class="size-9 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
			<ClockIcon class="size-4.5" />
		</div>
	</div>

	{#if activeShift}
		<div class="space-y-4 py-2">
			<div>
				<span class="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Shift Name</span>
				<span class="text-base font-bold text-neutral-800 mt-1 block">{activeShift.name}</span>
			</div>
			<div>
				<span class="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Shift Timing</span>
				<span class="text-sm font-bold text-neutral-700 mt-1 block">
					{formatShiftTime12h(activeShift.start_time)} - {formatShiftTime12h(activeShift.end_time)}
				</span>
			</div>
			<div>
				<span class="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Working Days</span>
				<span class="text-sm font-bold text-neutral-700 mt-1 block">Mon - Fri</span>
			</div>
		</div>
	{:else}
		<p class="text-xs font-semibold text-neutral-400 text-center py-6">No active shift assigned.</p>
	{/if}
</div>
