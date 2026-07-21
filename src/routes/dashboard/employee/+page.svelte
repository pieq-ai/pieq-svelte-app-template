<script lang="ts">
	import AttendanceWidget from '$lib/components/common/AttendanceWidget.svelte';
	import DashboardHeader from '$lib/components/dashboard/DashboardHeader.svelte';
	import DashboardSummaryCard from '$lib/components/dashboard/DashboardSummaryCard.svelte';
	import ShiftDetailsWidget from '$lib/components/dashboard/ShiftDetailsWidget.svelte';
	import HolidayCalendarWidget from '$lib/components/dashboard/HolidayCalendarWidget.svelte';
	import QuickActionsWidget from '$lib/components/dashboard/QuickActionsWidget.svelte';

	// Lucide Icons for cards and actions
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UmbrellaIcon from '@lucide/svelte/icons/umbrella';
	import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import UserIcon from '@lucide/svelte/icons/user';
	import UsersIcon from '@lucide/svelte/icons/users';

	let { data } = $props();

	// Quick actions for Employee
	const employeeActions = $derived([
		{ href: '/leaves', label: 'Apply Leave', Icon: UmbrellaIcon },
		{ href: data.latestPayrollCuid ? `/payroll-records/${data.latestPayrollCuid}/payslip` : undefined, label: 'Payslip', Icon: FileTextIcon, disabled: !data.latestPayrollCuid },
		{ href: '/attendance', label: 'Attendance', Icon: ClockIcon },
		{ href: `/employees/${data.employee.cuid}`, label: 'Profile', Icon: UserIcon }
	]);
</script>

<svelte:head>
	<title>Employee Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">

	<header class="flex items-center justify-between py-2">
	</header>

	{#if data.employee}
		<!-- Header / Greeting area -->
		<DashboardHeader employee={data.employee} />

		<!-- Compact My Attendance Row Widget -->
		<AttendanceWidget employee={data.employee} activeShift={data.activeShift} todayAttendance={data.todayAttendance} />

		<!-- 6 Stats Grid Cards -->
		<section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			<DashboardSummaryCard value={data.stats.presentDays} label="Present Days" Icon={CalendarIcon} />
			<DashboardSummaryCard value={Number(data.stats.leaveBalance || 0).toFixed(1)} label="Leave Balance" Icon={UmbrellaIcon} />
			<DashboardSummaryCard value={Number(data.stats.pendingLeave) === 0 ? '0' : String(data.stats.pendingLeave).padStart(2, '0')} label="Pending Leave" Icon={MessageSquareMoreIcon} />
			<DashboardSummaryCard value={data.stats.averageWorkingHours} label="Avg Work Hours" Icon={ClockIcon} valueColor="text-[#F45310]" />
			<DashboardSummaryCard value="{data.stats.thisMonthHours}h" label="This Month" Icon={ClockIcon} />
			<DashboardSummaryCard value={String(data.stats.upcomingHolidaysCount).padStart(2, '0')} label="Upcoming Holidays" Icon={SparklesIcon} valueColor="text-[#F45310]" href="/holidays" />
		</section>

		<!-- Main Workspace Grid -->
		<section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<ShiftDetailsWidget activeShift={data.activeShift} />
			<QuickActionsWidget actions={employeeActions} />
			<HolidayCalendarWidget events={data.upcomingEvents} />
		</section>

		<!-- Team Details Section (Reporting Hierarchy Only) -->
		{#if data.teamMembers && data.teamMembers.length > 0}
			<section class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2">
						<UsersIcon class="size-5 text-[#F45310]" />
						<h3 class="text-lg font-bold text-neutral-900">Team Details</h3>
					</div>
					<span class="text-xs font-semibold text-neutral-400">
						{data.teamMembers.length} {data.teamMembers.length === 1 ? 'member' : 'members'}
					</span>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full text-left border-collapse">
						<thead>
							<tr class="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
								<th class="pb-3 font-semibold">Name</th>
								<th class="pb-3 font-semibold">Employee ID</th>
								<th class="pb-3 font-semibold">Designation</th>
								<th class="pb-3 font-semibold text-right">Role</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-neutral-100 text-sm">
							{#each data.teamMembers as member}
								<tr>
									<td class="py-3.5 font-bold text-neutral-800">
										{member.name}
									</td>
									<td class="py-3.5 font-medium text-neutral-500 text-xs">
										{member.emp_code}
									</td>
									<td class="py-3.5 text-neutral-600 font-medium text-xs">
										{member.designation}
									</td>
									<td class="py-3.5 text-right">
										{#if member.memberRole === 'Manager'}
											<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-[#F45310]/10 text-[#F45310] border border-[#F45310]/20">
												Manager
											</span>
										{:else}
											<span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
												Employee
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
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
