<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/toast';
	import { onMount } from 'svelte';
	import ConfirmModal from './ConfirmModal.svelte';

	let { employee, activeShift, todayAttendance } = $props<{
		employee: any;
		activeShift: any;
		todayAttendance: any;
	}>();

	let showConfirmModal = $state(false);
	let confirmActionType = $state<'in' | 'out' | null>(null);

	// Geolocation coordinates tracking
	let gpsLatitude = $state<number | null>(null);
	let gpsLongitude = $state<number | null>(null);
	let locationError = $state<string | null>(null);
	let locationPermissionDenied = $state(false);
	let isLocating = $state(false);
	let isSubmitting = $state(false);

	onMount(() => {
		if (!navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser';
			return;
		}

		isLocating = true;
		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				gpsLatitude = position.coords.latitude;
				gpsLongitude = position.coords.longitude;
				locationError = null;
				locationPermissionDenied = false;
				isLocating = false;
			},
			(error) => {
				isLocating = false;
				if (error.code === error.PERMISSION_DENIED) {
					locationPermissionDenied = true;
					locationError = 'Location permission denied. Please allow location access to mark attendance.';
				} else {
					locationError = error.message || 'Unable to determine location';
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 0
			}
		);

		return () => {
			navigator.geolocation.clearWatch(watchId);
		};
	});

	// Formatters
	function formatTimeOnly(dateStr: string | null | undefined): string {
		if (!dateStr) return '--:--';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return '--:--';
		return d.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

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

	async function handleCheckIn() {
		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const res = await fetch('/api/attendance/check-in', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_cuid: employee?.cuid,
					attendance_source_cuid: null,
					latitude: gpsLatitude,
					longitude: gpsLongitude
				})
			});

			const body = await res.json();
			if (res.ok) {
				toast.success('Checked in successfully!');
				await invalidateAll();
			} else {
				const errorMsg = body.data?.error 
					? (typeof body.data.error === 'object' ? Object.values(body.data.error).join(', ') : body.data.error)
					: 'Check-in failed';
				toast.error(errorMsg);
			}
		} catch (error) {
			console.error(error);
			toast.error('An unexpected error occurred during check-in');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCheckOut() {
		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const res = await fetch('/api/attendance/check-out', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_cuid: employee?.cuid,
					latitude: gpsLatitude,
					longitude: gpsLongitude
				})
			});

			const body = await res.json();
			if (res.ok) {
				toast.success('Checked out successfully!');
				await invalidateAll();
			} else {
				const errorMsg = body.data?.error 
					? (typeof body.data.error === 'object' ? Object.values(body.data.error).join(', ') : body.data.error)
					: 'Check-out failed';
				toast.error(errorMsg);
			}
		} catch (error) {
			console.error(error);
			toast.error('An unexpected error occurred during check-out');
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if employee}
	<!-- Compact My Attendance Row Widget -->
	<section class="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div class="flex flex-col gap-1">
			<h3 class="text-base font-bold text-neutral-900">My Attendance</h3>
			<p class="text-xs text-neutral-500">
				Status: 
				{#if todayAttendance}
					{#if todayAttendance.status === 'Present' || todayAttendance.status === 'WFH'}
						<span class="font-bold text-emerald-600">Present</span>
					{:else if todayAttendance.status === 'HalfDay' || todayAttendance.status === 'Half Day'}
						<span class="font-bold text-amber-500">Half Day</span>
					{:else}
						<span class="font-bold text-[#F45310]">{todayAttendance.status}</span>
					{/if}
				{:else}
					<span class="font-bold text-neutral-400">Absent</span>
				{/if}
				<span class="mx-1.5">•</span>
				Current Shift: 
				{#if activeShift}
					<span class="font-semibold text-neutral-700">{activeShift.name} ({formatShiftTime12h(activeShift.start_time)} - {formatShiftTime12h(activeShift.end_time)})</span>
				{:else}
					<span class="font-semibold text-neutral-400">—</span>
				{/if}
			</p>
		</div>

		<div class="flex items-center gap-8 text-sm">
			<div>
				<span class="text-xs text-neutral-400 font-semibold block">Check In</span>
				<span class="text-sm font-bold text-neutral-700 mt-0.5 block">{formatTimeOnly(todayAttendance?.check_in_time)}</span>
			</div>
			<div>
				<span class="text-xs text-neutral-400 font-semibold block">Check Out</span>
				<span class="text-sm font-bold text-neutral-700 mt-0.5 block">{formatTimeOnly(todayAttendance?.check_out_time)}</span>
			</div>
			<div class="border-l border-neutral-200 pl-6">
				{#if todayAttendance && todayAttendance.check_out_time}
					<button
						disabled
						class="px-5 py-2.5 bg-neutral-100 text-neutral-400 text-xs font-bold rounded-xl border border-neutral-200 cursor-not-allowed"
					>
						Attendance Marked
					</button>
				{:else if todayAttendance}
					<button
						onclick={() => {
							confirmActionType = 'out';
							showConfirmModal = true;
						}}
						disabled={isSubmitting || locationPermissionDenied || isLocating}
						class="px-5 py-2.5 bg-[#F45310] hover:bg-[#D8420B] text-white text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
					>
						Check Out
					</button>
				{:else}
					<button
						onclick={() => {
							confirmActionType = 'in';
							showConfirmModal = true;
						}}
						disabled={isSubmitting || locationPermissionDenied || isLocating}
						class="px-5 py-2.5 bg-[#F45310] hover:bg-[#D8420B] text-white text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
					>
						Check In
					</button>
				{/if}
			</div>
		</div>
	</section>

	<ConfirmModal
		open={showConfirmModal}
		title={confirmActionType === 'in' ? 'Confirm Check In' : 'Confirm Check Out'}
		description={confirmActionType === 'in' ? 'Are you sure you want to check in now?' : 'Are you sure you want to check out now?'}
		confirmLabel={confirmActionType === 'in' ? 'Check In' : 'Check Out'}
		cancelLabel="Cancel"
		isSubmitting={isSubmitting}
		onCancel={() => {
			showConfirmModal = false;
			confirmActionType = null;
		}}
		onConfirm={async () => {
			if (confirmActionType === 'in') {
				await handleCheckIn();
			} else if (confirmActionType === 'out') {
				await handleCheckOut();
			}
			showConfirmModal = false;
			confirmActionType = null;
		}}
	/>
{/if}
