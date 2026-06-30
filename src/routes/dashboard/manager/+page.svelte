<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/toast';
	import { onMount } from 'svelte';

	// Lucide Icons
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UmbrellaIcon from '@lucide/svelte/icons/umbrella';
	import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import UserIcon from '@lucide/svelte/icons/user';
	import BellIcon from '@lucide/svelte/icons/bell';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import UsersIcon from '@lucide/svelte/icons/users';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import AwardIcon from '@lucide/svelte/icons/award';

	let { data } = $props();

	// Switcher State
	let isSwitcherOpen = $state(false);

	// Dynamic Greeting based on time of day
	const currentHour = new Date().getHours();
	const greeting = currentHour < 12 ? 'Good Morning' : (currentHour < 17 ? 'Good Afternoon' : 'Good Evening');

	// Geolocation coordinates tracking
	let gpsLatitude = $state<number | null>(null);
	let gpsLongitude = $state<number | null>(null);
	let locationError = $state<string | null>(null);
	let locationPermissionDenied = $state(false);
	let isLocating = $state(false);

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

	// Dynamic work duration string
	let durationString = $state('00h 00m');
	let checkInTimeUTC = $derived(data.todayAttendance?.check_in_time);

	$effect(() => {
		if (!checkInTimeUTC || data.todayAttendance?.check_out_time) {
			if (data.todayAttendance?.work_duration_minutes) {
				const mins = data.todayAttendance.work_duration_minutes;
				const h = Math.floor(mins / 60);
				const m = mins % 60;
				durationString = `${h}h ${m}m`;
			} else {
				durationString = '--';
			}
			return;
		}

		const updateDuration = () => {
			const checkInDate = new Date(checkInTimeUTC);
			const diffMs = Date.now() - checkInDate.getTime();
			const totalMins = Math.max(0, Math.floor(diffMs / 60000));
			const h = Math.floor(totalMins / 60);
			const m = totalMins % 60;
			durationString = `${h}h ${m}m`;
		};

		updateDuration();
		const interval = setInterval(updateDuration, 60000);

		return () => clearInterval(interval);
	});

	let isSubmitting = $state(false);

	async function handleCheckIn() {
		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const res = await fetch('/api/attendance/check-in', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_cuid: data.employee?.cuid,
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
					employee_cuid: data.employee?.cuid,
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

	function formatShiftTime(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return '';
		let hours = d.getUTCHours();
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12;
		return `${hours}`;
	}

	function getEventMonthName(dateStr: string | Date): string {
		const d = new Date(dateStr);
		return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
	}

	function getEventDay(dateStr: string | Date): string {
		const d = new Date(dateStr);
		return String(d.getDate()).padStart(2, '0');
	}

	const formattedTodayDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
</script>

<svelte:head>
	<title>Manager Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">

	<!-- Header Area: Dashboard Title, Switcher, Notification Bell -->
	<header class="flex items-center justify-between py-2">
		<div class="flex items-center gap-4">
			<h1 class="text-xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
			
			<!-- Dashboard Switcher Dropdown -->
			<div class="relative">
				<button
					type="button"
					onclick={() => (isSwitcherOpen = !isSwitcherOpen)}
					class="h-9 min-w-[180px] flex items-center justify-between border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold rounded-xl shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer outline-none text-neutral-700"
				>
					<span>Manager Dashboard</span>
					<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
				</button>
				
				{#if isSwitcherOpen}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div 
						class="fixed inset-0 z-40" 
						onclick={() => (isSwitcherOpen = false)}
					></div>
					
					<div class="absolute left-0 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-50 py-1">
						<button
							type="button"
							onclick={() => { goto('/dashboard/employee'); isSwitcherOpen = false; }}
							class="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 cursor-pointer border-none bg-transparent font-bold"
						>
							Employee Dashboard
						</button>
						<button
							type="button"
							onclick={() => { isSwitcherOpen = false; }}
							class="w-full text-left px-4 py-2 text-xs text-[#F45310] bg-neutral-50 cursor-default border-none font-bold"
						>
							Manager Dashboard
						</button>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-4">
			<button class="relative p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-600 border-none bg-transparent" aria-label="Notifications">
				<BellIcon class="size-5" />
				<span class="absolute top-1.5 right-1.5 size-2 bg-[#F45310] rounded-full"></span>
			</button>
		</div>
	</header>

	{#if data.employee}
		{#if data.managerContext}
			<!-- Greeting Section & Action Buttons -->
			<section class="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-[#FAF9F6]">
				<div class="space-y-3">
					<h2 class="text-4xl font-bold tracking-tight text-neutral-900">
						{greeting}, {data.employee.first_name}
					</h2>
					<p class="text-sm font-medium text-neutral-500">Today is {formattedTodayDate}</p>
					<div class="flex flex-wrap gap-2 pt-1">
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
							<UserIcon class="size-3" />
							Manager ID: {data.managerContext.managerId}
						</span>
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
							<Building2Icon class="size-3" />
							Department: {data.managerContext.departmentName}
						</span>
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
							<UsersIcon class="size-3" />
							Team: {data.managerContext.teamName}
						</span>
					</div>
				</div>

				<!-- Quick action buttons on the right -->
				<div class="flex items-center gap-3">
					<a
						href="/leaves"
						class="flex items-center gap-2 bg-[#A9360E] hover:bg-[#8F2D0B] text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-colors decoration-none"
					>
						<PlusIcon class="size-4" />
						<span>Approve Requests</span>
					</a>
					<a
						href="/shift-assignments"
						class="flex items-center gap-2 bg-white border border-neutral-250 text-neutral-700 hover:bg-neutral-50 text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-colors decoration-none"
					>
						<LayoutGridIcon class="size-4 text-neutral-500" />
						<span>Shift Assignment</span>
					</a>
				</div>
			</section>

			<!-- Compact My Attendance Row Widget -->
			<section class="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div class="flex flex-col gap-1">
					<h3 class="text-base font-bold text-neutral-900">My Attendance</h3>
					<p class="text-xs text-neutral-500">
						Status: 
						{#if data.todayAttendance}
							{#if data.todayAttendance.status === 'Present' || data.todayAttendance.status === 'WFH'}
								<span class="font-bold text-emerald-600">Present</span>
							{:else if data.todayAttendance.status === 'HalfDay' || data.todayAttendance.status === 'Half Day'}
								<span class="font-bold text-amber-500">Half Day</span>
							{:else}
								<span class="font-bold text-[#F45310]">{data.todayAttendance.status}</span>
							{/if}
						{:else}
							<span class="font-bold text-neutral-400">Absent</span>
						{/if}
						<span class="mx-1.5">•</span>
						Current Shift: 
						{#if data.activeShift}
							<span class="font-semibold text-neutral-700">{data.activeShift.name} ({formatShiftTime(data.activeShift.start_time)}:00 AM - {formatShiftTime(data.activeShift.end_time)}:00 PM)</span>
						{:else}
							<span class="font-semibold text-neutral-400">—</span>
						{/if}
					</p>
				</div>

				<div class="flex items-center gap-8 text-sm">
					<div>
						<span class="text-xs text-neutral-400 font-semibold block">Check In</span>
						<span class="text-sm font-bold text-neutral-700 mt-0.5 block">{formatTimeOnly(data.todayAttendance?.check_in_time)}</span>
					</div>
					<div>
						<span class="text-xs text-neutral-400 font-semibold block">Check Out</span>
						<span class="text-sm font-bold text-neutral-700 mt-0.5 block">{formatTimeOnly(data.todayAttendance?.check_out_time)}</span>
					</div>
					<div class="border-l border-neutral-200 pl-6">
						{#if data.todayAttendance && data.todayAttendance.check_out_time}
							<button
								disabled
								class="px-5 py-2.5 bg-neutral-100 text-neutral-400 text-xs font-bold rounded-xl border border-neutral-200 cursor-not-allowed"
							>
								Attendance Marked
							</button>
						{:else if data.todayAttendance}
							<button
								onclick={handleCheckOut}
								disabled={isSubmitting || locationPermissionDenied || isLocating}
								class="px-5 py-2.5 bg-[#A9360E] hover:bg-[#8F2D0B] text-white text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
							>
								Check Out
							</button>
						{:else}
							<button
								onclick={handleCheckIn}
								disabled={isSubmitting || locationPermissionDenied || isLocating}
								class="px-5 py-2.5 bg-[#A9360E] hover:bg-[#8F2D0B] text-white text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
							>
								Check In
							</button>
						{/if}
					</div>
				</div>
			</section>

			<!-- 5 Metrics Cards Grid (Regularization removed, layout changed to lg:grid-cols-5) -->
			<section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
				<!-- Total Members -->
				<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
					<div class="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
						<UsersIcon class="size-5" />
					</div>
					<span class="text-3xl font-extrabold text-neutral-900 mt-3">{data.managerContext.metrics.totalMembers}</span>
					<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Total Members</span>
				</div>

				<!-- Present -->
				<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
					<div class="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
						<CheckCircle2Icon class="size-5" />
					</div>
					<span class="text-3xl font-extrabold text-neutral-900 mt-3">{data.managerContext.metrics.present}</span>
					<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Present</span>
				</div>

				<!-- On Leave -->
				<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
					<div class="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
						<UmbrellaIcon class="size-5" />
					</div>
					<span class="text-3xl font-extrabold text-neutral-900 mt-3">{data.managerContext.metrics.onLeave}</span>
					<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">On Leave</span>
				</div>

				<!-- Approvals (left accent border as requested in design) -->
				<div class="bg-white border border-neutral-200/80 border-l-4 border-l-[#A9360E] rounded-r-2xl rounded-l-md p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
					<div class="size-10 rounded-full bg-rose-50 flex items-center justify-center text-[#A9360E]">
						<MessageSquareMoreIcon class="size-5" />
					</div>
					<span class="text-3xl font-extrabold text-[#A9360E] mt-3">{String(data.managerContext.metrics.approvals).padStart(2, '0')}</span>
					<span class="text-[11px] font-semibold text-[#A9360E] uppercase tracking-wider mt-1.5">Approvals</span>
				</div>

				<!-- Holidays -->
				<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
					<div class="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
						<Building2Icon class="size-5" />
					</div>
					<span class="text-3xl font-extrabold text-neutral-900 mt-3">{String(data.managerContext.metrics.holidays).padStart(2, '0')}</span>
					<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Holidays</span>
				</div>
			</section>

			<!-- Manager Main Workspace Grid -->
			<section class="grid grid-cols-1 lg:grid-cols-3 gap-6">

				<!-- Left Columns (Team Attendance and Leave Requests tables) -->
				<div class="lg:col-span-2 space-y-6">

					<!-- Team Daily Attendance Table -->
					<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
						<div class="flex items-center justify-between mb-5">
							<h3 class="text-lg font-bold text-neutral-900">Team Daily Attendance</h3>
							<button class="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors border-none bg-transparent cursor-pointer" aria-label="Filter list">
								<FilterIcon class="size-4" />
							</button>
						</div>

						<div class="overflow-x-auto">
							<table class="w-full text-left border-collapse">
								<thead>
									<tr class="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
										<th class="pb-3 font-semibold">Employee</th>
										<th class="pb-3 font-semibold">Check In</th>
										<th class="pb-3 font-semibold">Check Out</th>
										<th class="pb-3 font-semibold text-right">Status</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-neutral-100 text-sm">
									{#each data.managerContext.teamAttendance as team}
										<tr>
											<td class="py-3.5">
												<div class="flex flex-col">
													<span class="font-bold text-neutral-800">{team.name}</span>
													<span class="text-xs text-neutral-400 font-medium">{team.designation}</span>
												</div>
											</td>
											<td class="py-3.5 font-semibold text-neutral-700">
												{formatTimeOnly(team.check_in_time)}
											</td>
											<td class="py-3.5 font-semibold text-neutral-700">
												{formatTimeOnly(team.check_out_time)}
											</td>
											<td class="py-3.5 text-right">
												{#if team.status === 'On-Time'}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
														On-Time
													</span>
												{:else if team.status === 'Late In'}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
														Late In
													</span>
												{:else if team.status === 'WFH'}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
														WFH
													</span>
												{:else if team.status === 'On Leave'}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-100">
														On Leave
													</span>
												{:else}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
														Absent
													</span>
												{/if}
											</td>
										</tr>
									{:else}
										<tr>
											<td colspan="4" class="py-8 text-center text-xs text-neutral-400 font-semibold">No subordinate attendance logs today.</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Leave Requests Table -->
					<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
						<div class="flex items-center justify-between mb-5">
							<h3 class="text-lg font-bold text-neutral-900">Leave Requests</h3>
							<a href="/leaves" class="text-xs font-bold text-[#A9360E] hover:underline flex items-center gap-1 decoration-none">
								<span>View All</span>
								<ArrowRightIcon class="size-3" />
							</a>
						</div>

						<div class="overflow-x-auto">
							<table class="w-full text-left border-collapse">
								<thead>
									<tr class="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
										<th class="pb-3 font-semibold">Employee</th>
										<th class="pb-3 font-semibold">Type</th>
										<th class="pb-3 font-semibold">Duration</th>
										<th class="pb-3 font-semibold text-right">Status</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-neutral-100 text-sm">
									{#each data.managerContext.leaveRequests as req}
										<tr>
											<td class="py-3.5">
												<div class="flex flex-col">
													<span class="font-bold text-neutral-800">{req.employeeName}</span>
													<span class="text-xs text-neutral-400 font-medium">{req.designation}</span>
												</div>
											</td>
											<td class="py-3.5 text-neutral-600 font-medium">{req.type}</td>
											<td class="py-3.5 text-neutral-600 font-medium">{req.duration}</td>
											<td class="py-3.5 text-right">
												{#if req.status === 'Approved'}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
														Approved
													</span>
												{:else if req.status === 'Rejected'}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
														Rejected
													</span>
												{:else}
													<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
														Pending
													</span>
												{/if}
											</td>
										</tr>
									{:else}
										<tr>
											<td colspan="4" class="py-8 text-center text-xs text-neutral-400 font-semibold">No recent leave requests.</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

				</div>

				<!-- Right Sidebar Stack (Presence chart, actions, events) -->
				<div class="space-y-6">

					<!-- Today's Presence (solid red/orange block as requested in reference) -->
					<div class="bg-[#A9360E] rounded-2xl p-6 text-white shadow-xs flex flex-col justify-between min-h-[220px]">
						<div>
							<h3 class="text-lg font-bold text-white mb-6">Today's Presence</h3>
							<ul class="space-y-3.5 text-sm font-semibold">
								<li class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="size-2 rounded-full bg-white"></span>
										<span>Present</span>
									</div>
									<span class="text-base font-extrabold">{data.managerContext.todayPresence.present}</span>
								</li>
								<li class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="size-2 rounded-full bg-white/50"></span>
										<span>WFH</span>
									</div>
									<span class="text-base font-extrabold">{data.managerContext.todayPresence.wfh}</span>
								</li>
							</ul>
						</div>

						<div class="pt-6">
							<a
								href="/attendance"
								class="w-full flex items-center justify-center py-2.5 bg-white text-[#A9360E] text-xs font-bold rounded-xl shadow-xs hover:bg-neutral-50 transition-colors decoration-none"
							>
								View Attendance
							</a>
						</div>
					</div>

					<!-- Quick Actions Widget -->
					<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
						<h3 class="text-base font-bold text-neutral-900 mb-4">Quick Actions</h3>
						<div class="grid grid-cols-2 gap-3">
							<!-- Shift Assignment -->
							<a
								href="/shift-assignments"
								class="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-[#FFF4EE] hover:border-[#FFE2D3] hover:text-[#F45310] transition-all text-neutral-600 group text-center decoration-none"
							>
								<LayoutGridIcon class="size-6 text-neutral-400 group-hover:text-[#F45310] transition-colors" />
								<span class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors mt-2 leading-tight">Shift Assignment</span>
							</a>

							<!-- Holiday Calendar -->
							<a
								href="/holidays"
								class="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-[#FFF4EE] hover:border-[#FFE2D3] hover:text-[#F45310] transition-all text-neutral-600 group text-center decoration-none"
							>
								<CalendarIcon class="size-6 text-neutral-400 group-hover:text-[#F45310] transition-colors" />
								<span class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors mt-2 leading-tight">Holiday Calendar</span>
							</a>
						</div>
					</div>

					<!-- Upcoming Events Widget -->
					<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
						<div class="flex items-center justify-between mb-5">
							<h3 class="text-base font-bold text-neutral-900">Upcoming Events</h3>
							<a href="/holidays" class="text-xs font-bold text-[#A9360E] hover:underline decoration-none">View Calendar</a>
						</div>

						<div class="flex flex-col gap-4">
							{#each data.managerContext.events as event}
								<div class="flex items-center justify-between py-1 first:pt-0 last:pb-0">
									<div class="flex items-center gap-4">
										<!-- Left side: Date badge in a soft red background -->
										<div class="bg-[#FFF0EB] border border-[#FFE2D3] rounded-xl px-2.5 py-1.5 text-center flex flex-col items-center justify-center min-w-[50px]">
											<span class="text-[9px] font-extrabold text-[#F45310] leading-none uppercase">{getEventMonthName(event.date)}</span>
											<span class="text-base font-extrabold text-[#F45310] leading-none mt-1">{getEventDay(event.date)}</span>
										</div>

										<!-- Middle details -->
										<div class="space-y-0.5">
											<p class="text-sm font-bold text-neutral-800 leading-tight">{event.name}</p>
											<p class="text-[11px] font-semibold text-neutral-400 tracking-wide">{event.label}</p>
										</div>
									</div>

									<!-- Right side icon -->
									<div class="text-neutral-355">
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
								<p class="text-xs font-semibold text-neutral-400 text-center py-4">No upcoming events scheduled.</p>
							{/each}
						</div>
					</div>

				</div>

			</section>
		{/if}
	{:else}
		<div class="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-neutral-500">
			Loading workspace details...
		</div>
	{/if}

	<!-- Admin Restricted Section -->
	{#if data.showAdminSection}
		<section class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
			<h3 class="text-sm font-bold text-neutral-900 mb-2">
				Admin <span class="ml-2 px-2.5 py-0.5 bg-[#8C3C3C]/10 text-[#8C3C3C] rounded-full text-[10px] font-extrabold uppercase tracking-wider">Restricted</span>
			</h3>
			<p class="text-xs font-semibold text-neutral-400 m-0">
				Visible only when the Keycloak token includes the <code class="bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded text-[10px] text-neutral-600 font-mono">admin</code> role.
			</p>
		</section>
	{/if}

</div>
