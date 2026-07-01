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
	import PercentIcon from '@lucide/svelte/icons/percent';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import UserIcon from '@lucide/svelte/icons/user';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import BellIcon from '@lucide/svelte/icons/bell';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import Building2Icon from '@lucide/svelte/icons/building-2';

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

	function getEventMonthName(dateStr: string | Date): string {
		const d = new Date(dateStr);
		return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
	}

	function getEventDay(dateStr: string | Date): string {
		const d = new Date(dateStr);
		return String(d.getDate()).padStart(2, '0');
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

	const formattedTodayDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
</script>

<svelte:head>
	<title>Employee Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">

	<!-- Header Area: Dashboard Title, Switcher (if Manager), Notification Bell -->
	<header class="flex items-center justify-between py-2">
		<div class="flex items-center gap-4">
			<h1 class="text-xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
			

		</div>

		<div class="flex items-center gap-4">
			<button class="relative p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-600 border-none bg-transparent" aria-label="Notifications">
				<BellIcon class="size-5" />
				<span class="absolute top-1.5 right-1.5 size-2 bg-[#F45310] rounded-full"></span>
			</button>
		</div>
	</header>

	{#if data.employee}
		<!-- Greeting Section & Reporting Manager block -->
		<section class="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-[#FAF9F6]">
			<div class="space-y-3">
				<h2 class="text-4xl font-bold tracking-tight text-neutral-900">
					{greeting}, {data.employee.first_name}
				</h2>
				<p class="text-sm font-medium text-neutral-500">{formattedTodayDate}</p>
				<div class="flex flex-wrap gap-2 pt-1">
					<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
						ID: {data.employee.emp_code}
					</span>
					<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
						{data.employee.department}
					</span>
					<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200">
						{data.employee.designation}
					</span>
				</div>
			</div>

			<!-- Reporting Manager Card (No avatar, clean and visually balanced) -->
			<div class="bg-[#FFF4EE] border border-[#FFE2D3] rounded-2xl p-5 min-w-[240px] flex flex-col justify-center shadow-xs">
				<span class="text-xs font-semibold text-[#F45310] tracking-wider uppercase">Reporting Manager</span>
				<span class="text-base font-bold text-neutral-900 mt-1">{data.employee.reportingManager}</span>
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
						<span class="font-semibold text-neutral-700">{data.activeShift.name} ({formatShiftTime12h(data.activeShift.start_time)} - {formatShiftTime12h(data.activeShift.end_time)})</span>
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
							class="px-5 py-2.5 bg-[#F45310] hover:bg-[#D8420B] text-white text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
						>
							Check Out
						</button>
					{:else}
						<button
							onclick={handleCheckIn}
							disabled={isSubmitting || locationPermissionDenied || isLocating}
							class="px-5 py-2.5 bg-[#F45310] hover:bg-[#D8420B] text-white text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
						>
							Check In
						</button>
					{/if}
				</div>
			</div>
		</section>

		<!-- 6 Stats Grid Cards -->
		<section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			<!-- Present Days -->
			<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
				<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
					<CalendarIcon class="size-5" />
				</div>
				<span class="text-3xl font-extrabold text-neutral-900 mt-3">{data.stats.presentDays}</span>
				<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Present Days</span>
			</div>

			<!-- Leave Balance -->
			<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
				<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
					<UmbrellaIcon class="size-5" />
				</div>
				<span class="text-3xl font-extrabold text-neutral-900 mt-3">{data.stats.leaveBalance}</span>
				<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Leave Balance</span>
			</div>

			<!-- Pending Leave -->
			<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
				<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
					<MessageSquareMoreIcon class="size-5" />
				</div>
				<span class="text-3xl font-extrabold text-neutral-900 mt-3">{String(data.stats.pendingLeave).padStart(2, '0')}</span>
				<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Pending Leave</span>
			</div>

			<!-- Avg Work Hours -->
			<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
				<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
					<ClockIcon class="size-5" />
				</div>
				<span class="text-2xl font-extrabold text-[#F45310] mt-3">{data.stats.averageWorkingHours}</span>
				<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Avg Work Hours</span>
			</div>

			<!-- This Month -->
			<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
				<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
					<ClockIcon class="size-5" />
				</div>
				<span class="text-3xl font-extrabold text-neutral-900 mt-3">{data.stats.thisMonthHours}h</span>
				<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">This Month</span>
			</div>

			<!-- Upcoming Hol. -->
			<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200">
				<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
					<SparklesIcon class="size-5" />
				</div>
				<span class="text-3xl font-extrabold text-[#F45310] mt-3">{String(data.stats.upcomingHolidaysCount).padStart(2, '0')}</span>
				<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Upcoming Hol.</span>
			</div>
		</section>

		<!-- Main Workspace Grid -->
		<section class="grid grid-cols-1 lg:grid-cols-3 gap-6">

			<!-- Team Details widget (Left, occupying 2 columns) -->
			<div class="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
				<div>
					<div class="flex items-center justify-between mb-5">
						<h3 class="text-lg font-bold text-neutral-900">Team Details</h3>
					</div>

					<div class="overflow-x-auto">
						<table class="w-full text-left border-collapse">
							<thead>
								<tr class="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
									<th class="pb-3 font-semibold">Employee Name</th>
									<th class="pb-3 font-semibold">Role</th>
									<th class="pb-3 font-semibold">Department</th>
									<th class="pb-3 font-semibold">Designation</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-neutral-100 text-sm">
								{#each data.teamMembers as member}
									<tr class="hover:bg-neutral-50/50 transition-colors">
										<td class="py-3.5 font-bold text-neutral-800">
											{member.name}
										</td>
										<td class="py-3.5 text-neutral-600 font-medium">
											{member.role}
										</td>
										<td class="py-3.5 text-neutral-600 font-medium">
											{member.department}
										</td>
										<td class="py-3.5 text-neutral-600 font-medium">
											{member.designation}
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="4" class="py-8 text-center text-xs text-neutral-400 font-semibold">No team members found.</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- Widgets Stack (Right sidebar, occupying 1 column) -->
			<div class="space-y-6">

				<!-- Shift Details Widget -->
				<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-bold text-neutral-900">Shift Details</h3>
						<div class="size-9 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
							<ClockIcon class="size-4.5" />
						</div>
					</div>

					{#if data.activeShift}
						<div class="space-y-4 py-2">
							<div>
								<span class="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Shift Name</span>
								<span class="text-base font-bold text-neutral-800 mt-1 block">{data.activeShift.name}</span>
							</div>
							<div>
								<span class="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Shift Timing</span>
								<span class="text-sm font-bold text-neutral-700 mt-1 block">
									{formatShiftTime12h(data.activeShift.start_time)} - {formatShiftTime12h(data.activeShift.end_time)}
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

				<!-- Quick Actions Widget -->
				<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
					<h3 class="text-lg font-bold text-neutral-900 mb-5">Quick Actions</h3>
					<div class="grid grid-cols-4 gap-3">
						<!-- Apply Leave -->
						<a href="/leaves" class="flex flex-col items-center gap-2 group text-center decoration-none">
							<div class="size-12 rounded-2xl border border-neutral-100 flex items-center justify-center text-neutral-600 bg-white group-hover:bg-[#FFF4EE] group-hover:border-[#FFE2D3] group-hover:text-[#F45310] transition-colors">
								<UmbrellaIcon class="size-5.5" />
							</div>
							<span class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors leading-tight">Apply Leave</span>
						</a>

						<!-- Payslip -->
						{#if data.latestPayrollCuid}
							<a href="/payroll-records/{data.latestPayrollCuid}/payslip" class="flex flex-col items-center gap-2 group text-center decoration-none">
								<div class="size-12 rounded-2xl border border-neutral-100 flex items-center justify-center text-neutral-600 bg-white group-hover:bg-[#FFF4EE] group-hover:border-[#FFE2D3] group-hover:text-[#F45310] transition-colors">
									<FileTextIcon class="size-5.5" />
								</div>
								<span class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors leading-tight">Payslip</span>
							</a>
						{:else}
							<div class="flex flex-col items-center gap-2 group text-center cursor-not-allowed select-none opacity-50">
								<div class="size-12 rounded-2xl border border-neutral-100 flex items-center justify-center text-neutral-400 bg-white">
									<FileTextIcon class="size-5.5" />
								</div>
								<span class="text-[11px] font-bold text-neutral-400 leading-tight">Payslip</span>
							</div>
						{/if}

						<!-- Attendance -->
						<a href="/attendance" class="flex flex-col items-center gap-2 group text-center decoration-none">
							<div class="size-12 rounded-2xl border border-neutral-100 flex items-center justify-center text-neutral-600 bg-white group-hover:bg-[#FFF4EE] group-hover:border-[#FFE2D3] group-hover:text-[#F45310] transition-colors">
								<ClockIcon class="size-5.5" />
							</div>
							<span class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors leading-tight">Attendance</span>
						</a>

						<!-- Profile -->
						<a href="/employees/{data.employee.cuid}" class="flex flex-col items-center gap-2 group text-center decoration-none">
							<div class="size-12 rounded-2xl border border-neutral-100 flex items-center justify-center text-neutral-600 bg-white group-hover:bg-[#FFF4EE] group-hover:border-[#FFE2D3] group-hover:text-[#F45310] transition-colors">
								<UserIcon class="size-5.5" />
							</div>
							<span class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors leading-tight">Profile</span>
						</a>
					</div>
				</div>

				<!-- Upcoming Events Widget -->
				<div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
					<h3 class="text-lg font-bold text-neutral-900 mb-5">Upcoming Events</h3>
					<div class="flex flex-col gap-4">
						{#each data.upcomingEvents as event}
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
										<p class="text-[11px] font-semibold text-neutral-400 tracking-wide">{event.location}</p>
									</div>
								</div>

								<!-- Right side icon -->
								<div class="text-neutral-300">
									{#if event.type === 'holiday'}
										<Building2Icon class="size-5 text-[#FFE2D3]" />
									{:else}
										<CakeIcon class="size-5 text-[#FFE2D3]" />
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
