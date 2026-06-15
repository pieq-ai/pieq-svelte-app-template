<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/toast';
	import {
		Badge,
		Button,
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
		Label,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		Input,
		CrudModal
	} from '$lib/components';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import CheckIcon from '@lucide/svelte/icons/check';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedEmployeeUuid = $state('');
	let isSubmitting = $state(false);

	// Employee-specific history and active record state
	let historyRecords = $state<any[]>([]);
	let isLoadingHistory = $state(false);

	// Local state for dropdown searching
	let empSearchQuery = $state('');

	let todayRecord = $derived(
		historyRecords.find((rec: any) => rec.attendance_date === data.todayStr) || null
	);

	let employeeOptions = $derived(
		data.employees.map((emp: any) => ({
			id: emp.uuid,
			label: `${emp.name} (Age: ${emp.age})`
		}))
	);

	let filteredEmployeeOptions = $derived.by(() => {
		const q = empSearchQuery.toLowerCase().trim();
		if (!q) return employeeOptions;
		return employeeOptions.filter(o => o.label.toLowerCase().includes(q));
	});

	// Monthly Calendar navigation
	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	let currentMonth = $state(new Date().getMonth());
	let currentYear = $state(new Date().getFullYear());

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear -= 1;
		} else {
			currentMonth -= 1;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear += 1;
		} else {
			currentMonth += 1;
		}
	}

	let calendarMonthDays = $derived.by(() => {
		const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
		const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
		const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

		const days = [];

		// Prev month days
		for (let i = firstDayIndex - 1; i >= 0; i--) {
			const prevMonthVal = currentMonth === 0 ? 11 : currentMonth - 1;
			const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
			const dayVal = totalDaysInPrevMonth - i;
			const cellDateStr = `${prevYearVal}-${String(prevMonthVal + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
			days.push({
				day: dayVal,
				month: prevMonthVal,
				year: prevYearVal,
				isCurrentMonth: false,
				isToday: false,
				dateStr: cellDateStr
			});
		}

		// Current month days
		const todayDate = new Date();
		for (let i = 1; i <= totalDaysInMonth; i++) {
			const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
			days.push({
				day: i,
				month: currentMonth,
				year: currentYear,
				isCurrentMonth: true,
				isToday: todayDate.getDate() === i && todayDate.getMonth() === currentMonth && todayDate.getFullYear() === currentYear,
				dateStr: cellDateStr
			});
		}

		// Next month days to fill grid of 42
		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const nextMonthVal = currentMonth === 11 ? 0 : currentMonth + 1;
			const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
			const cellDateStr = `${nextYearVal}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
			days.push({
				day: i,
				month: nextMonthVal,
				year: nextYearVal,
				isCurrentMonth: false,
				isToday: false,
				dateStr: cellDateStr
			});
		}

		return days;
	});

	function getISODateString(dateInput: string | Date): string {
		const d = new Date(dateInput);
		const year = d.getUTCFullYear();
		const month = String(d.getUTCMonth() + 1).padStart(2, '0');
		const day = String(d.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getDayStatus(dateStr: string) {
		const record = historyRecords.find((rec) => rec.attendance_date === dateStr);
		if (record) {
			const status = record.attendance_status;
			if (status === 'Present' || status === 'Late' || status === 'Half Day') {
				return { status: 'Present', color: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20' };
			}
			if (status === 'Absent') {
				return { status: 'Absent', color: 'bg-destructive/10 text-destructive border border-destructive/20' };
			}
			if (status === 'On Leave') {
				return { status: 'Leave', color: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20' };
			}
			if (status === 'WFH') {
				return { status: 'WFH', color: 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20' };
			}
		}

		const isHoliday = data.holidays.some((h: any) => getISODateString(h.holiday_date) === dateStr);
		if (isHoliday) {
			return { status: 'Holiday', color: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20' };
		}

		return null;
	}

	// Dynamic stats cards metrics
	let presentDaysCount = $derived(
		historyRecords.filter(r => r.attendance_status === 'Present' || r.attendance_status === 'Late' || r.attendance_status === 'Half Day').length
	);
	let absentDaysCount = $derived(
		historyRecords.filter(r => r.attendance_status === 'Absent').length
	);
	let leaveDaysCount = $derived(
		historyRecords.filter(r => r.attendance_status === 'On Leave').length
	);
	let wfhDaysCount = $derived(
		historyRecords.filter(r => r.attendance_status === 'WFH').length
	);
	let totalWorkingHours = $derived(
		(historyRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0) / 60).toFixed(1)
	);
	let attendancePercentage = $derived.by(() => {
		const total = presentDaysCount + absentDaysCount + leaveDaysCount + wfhDaysCount;
		if (total === 0) return 0;
		return Math.round(((presentDaysCount + wfhDaysCount) / total) * 100);
	});

	// Load employee specific data
	async function loadEmployeeData(employeeUuid: string) {
		if (!employeeUuid) {
			historyRecords = [];
			return;
		}

		isLoadingHistory = true;
		try {
			const res = await fetch(`/api/attendance?employee_cuid=${employeeUuid}`);
			const body = await res.json();
			if (res.ok) {
				historyRecords = body.data || [];
			} else {
				toast.error(body.data?.error || 'Failed to load history');
			}
		} catch (error) {
			console.error(error);
			toast.error('Failed to retrieve history');
		} finally {
			isLoadingHistory = false;
		}
	}

	$effect(() => {
		loadEmployeeData(selectedEmployeeUuid);
	});

	// Helper formatters
	function formatDisplayDate(dateStr: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('-');
		if (parts.length !== 3) return dateStr;
		const year = parts[0];
		const monthIndex = parseInt(parts[1], 10) - 1;
		const day = parts[2];
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${day}-${monthNames[monthIndex]}-${year}`;
	}

	function formatDisplayTime(timeStr: string | null) {
		if (!timeStr) return '--';
		const date = new Date(timeStr);
		if (isNaN(date.getTime())) return '--';
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDuration(minutes: number | null) {
		if (minutes === null || minutes === undefined) return '--';
		const hrs = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hrs > 0) {
			return `${hrs}h ${mins}m`;
		}
		return `${mins}m`;
	}

	function getSourceName(cuid: string | null): string {
		if (!cuid) return '--';
		const src = data.sources.find((s: any) => s.id === cuid);
		return src ? src.label : cuid;
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'Present':
				return 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20';
			case 'Absent':
				return 'bg-destructive/10 text-destructive border border-destructive/20';
			case 'Late':
				return 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20';
			case 'Half Day':
				return 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20';
			case 'On Leave':
				return 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20';
			default:
				return '';
		}
	}

	// Actions
	async function handleCheckIn() {
		if (!selectedEmployeeUuid) return;
		isSubmitting = true;

		try {
			const res = await fetch('/api/attendance/check-in', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_cuid: selectedEmployeeUuid,
					attendance_source_cuid: null
				})
			});

			const body = await res.json();
			if (res.ok) {
				toast.success('Checked in successfully!');
				await loadEmployeeData(selectedEmployeeUuid);
				await invalidateAll(); // Keep background state fresh
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
		if (!selectedEmployeeUuid) return;
		isSubmitting = true;

		try {
			const res = await fetch('/api/attendance/check-out', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_cuid: selectedEmployeeUuid
				})
			});

			const body = await res.json();
			if (res.ok) {
				toast.success('Checked out successfully!');
				await loadEmployeeData(selectedEmployeeUuid);
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

<svelte:head>
	<title>Employee Attendance</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
	<!-- Header -->
	<div class="space-y-1 border-b border-border pb-6">
		<Badge variant="secondary" class="uppercase">HRMS Portal</Badge>
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
			Employee Attendance
		</h1>
		<p class="text-muted-foreground">
			Track your daily logs, check-in and check-out status, and visual attendance calendar.
		</p>
	</div>

	<!-- Employee Selector (Demo Context) -->
	<Card>
		<CardContent class="p-6">
			<div class="max-w-md space-y-2">
				<Label>Select Employee (Demo context user) <span class="text-destructive">*</span></Label>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none" {...props}>
								<span class="truncate pr-2">
									{selectedEmployeeUuid ? (employeeOptions.find(o => o.id === selectedEmployeeUuid)?.label || 'Select Employee') : 'Select Employee'}
								</span>
								<ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-[var(--bits-dropdown-menu-anchor-width)] max-h-60 overflow-y-auto">
						<div class="flex items-center border-b border-border px-3 py-2 bg-transparent">
							<SearchIcon class="mr-2 size-4 shrink-0 opacity-50" />
							<input
								type="text"
								bind:value={empSearchQuery}
								placeholder="Search employee..."
								class="flex h-7 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground"
							/>
							{#if empSearchQuery}
								<button
									type="button"
									onclick={() => (empSearchQuery = '')}
									class="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-accent cursor-pointer"
									title="Clear search"
									aria-label="Clear search"
								>
									<XIcon class="size-3" />
								</button>
							{/if}
						</div>
						<DropdownMenu.Group>
							{#each filteredEmployeeOptions as opt}
								<DropdownMenu.Item
									onclick={() => {
										selectedEmployeeUuid = opt.id;
										empSearchQuery = '';
									}}
									class="justify-between cursor-pointer {selectedEmployeeUuid === opt.id ? 'bg-accent text-accent-foreground font-semibold' : ''}"
								>
									<span class="truncate">{opt.label}</span>
									{#if selectedEmployeeUuid === opt.id}
										<CheckIcon class="size-4 shrink-0 text-[#F45310]" />
									{/if}
								</DropdownMenu.Item>
							{:else}
								<div class="px-3 py-4 text-sm text-muted-foreground text-center">
									No employees found
								</div>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</CardContent>
	</Card>

	{#if !selectedEmployeeUuid}
		<div class="text-center py-16 border rounded-lg bg-card text-muted-foreground font-medium flex flex-col items-center justify-center gap-3">
			<ClockIcon class="size-10 text-muted-foreground/50" />
			<span>Please select an employee to view their attendance dashboard.</span>
		</div>
	{:else}
		<!-- Stats Summary Cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-medium">Present</p>
						<div class="text-3xl font-bold">{presentDaysCount}</div>
					</div>
					<span class="size-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-medium">Absent</p>
						<div class="text-3xl font-bold">{absentDaysCount}</div>
					</div>
					<span class="size-3 rounded-full bg-destructive shadow-sm shadow-destructive/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-medium">Leave</p>
						<div class="text-3xl font-bold">{leaveDaysCount}</div>
					</div>
					<span class="size-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-medium">WFH</p>
						<div class="text-3xl font-bold">{wfhDaysCount}</div>
					</div>
					<span class="size-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
				</CardContent>
			</Card>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card class="bg-card">
				<CardContent class="p-6 flex items-center justify-between h-full">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-medium">Total Work Hours</p>
						<div class="text-3xl font-bold">{totalWorkingHours} hrs</div>
					</div>
					<ClockIcon class="size-8 text-[#F45310]" />
				</CardContent>
			</Card>

			<Card class="bg-card">
				<CardContent class="p-6 flex flex-col justify-center h-full space-y-2">
					<div class="flex items-center justify-between">
						<p class="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-medium">Attendance Rate</p>
						<span class="text-sm font-bold text-foreground">{attendancePercentage}%</span>
					</div>
					<div class="w-full bg-muted rounded-full h-2.5 overflow-hidden">
						<div class="bg-[#F45310] h-2.5 rounded-full transition-all duration-300" style="width: {attendancePercentage}%"></div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Action Section & Today's Info -->
		<Card>
			<CardHeader>
				<CardTitle>Daily Attendance Logger</CardTitle>
				<CardDescription>Simulate clocking in and out for today.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="flex flex-col md:flex-row gap-6 items-center justify-between">
					<!-- Today's Status Details -->
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full md:w-auto">
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-medium">Today's Status</span>
							<div class="font-bold text-sm">
								{#if todayRecord}
									<Badge class={`border-none px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(todayRecord.attendance_status)}`}>
										{todayRecord.attendance_status}
									</Badge>
								{:else}
									<span class="text-muted-foreground">Not Marked</span>
								{/if}
							</div>
						</div>
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-medium">Check In</span>
							<div class="font-bold text-sm">{todayRecord ? formatDisplayTime(todayRecord.check_in_time) : '--'}</div>
						</div>
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-medium">Check Out</span>
							<div class="font-bold text-sm">{todayRecord ? formatDisplayTime(todayRecord.check_out_time) : '--'}</div>
						</div>
						<div class="space-y-1">
							<span class="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-medium">Working Duration</span>
							<div class="font-bold text-sm">{todayRecord ? formatDuration(todayRecord.work_duration_minutes) : '--'}</div>
						</div>
					</div>

					<!-- Buttons -->
					<div class="flex items-center gap-3 w-full md:w-auto justify-end">
						{#if !todayRecord}
							<Button
								onclick={handleCheckIn}
								class="bg-[#F45310] text-white hover:bg-[#F45310]/90 border-none font-semibold px-6 h-10 w-full sm:w-auto"
								disabled={isSubmitting}
							>
								Check In
							</Button>
							<Button
								variant="outline"
								class="font-semibold px-6 h-10 w-full sm:w-auto"
								disabled={true}
							>
								Check Out
							</Button>
						{:else if todayRecord && !todayRecord.check_out_time}
							<Button
								variant="outline"
								class="font-semibold px-6 h-10 w-full sm:w-auto"
								disabled={true}
							>
								Check In
							</Button>
							<Button
								onclick={handleCheckOut}
								class="bg-[#800020] text-white hover:bg-[#800020]/90 border-none font-semibold px-6 h-10 w-full sm:w-auto"
								disabled={isSubmitting}
							>
								Check Out
							</Button>
						{:else}
							<div class="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 w-full">
								<CheckCircle2Icon class="size-4 shrink-0" />
								<span>Attendance logs completed for today.</span>
							</div>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Calendar View Card -->
		<Card class="bg-card">
			<CardHeader>
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div>
						<CardTitle>Attendance Calendar</CardTitle>
						<CardDescription>Visual tracker of your monthly status, leaves, and holidays.</CardDescription>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="icon-sm" onclick={prevMonth} title="Previous Month">
							‹
						</Button>
						<span class="text-sm font-semibold select-none min-w-[120px] text-center">
							{monthNames[currentMonth]} {currentYear}
						</span>
						<Button variant="outline" size="icon-sm" onclick={nextMonth} title="Next Month">
							›
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<!-- Legend -->
				<div class="flex flex-wrap gap-4 mb-6 text-xs font-semibold">
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-emerald-500/10 border border-emerald-500/20"></span>
						<span class="text-muted-foreground">Present</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-destructive/10 border border-destructive/20"></span>
						<span class="text-muted-foreground">Absent</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-amber-500/10 border border-amber-500/20"></span>
						<span class="text-muted-foreground">Leave</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-blue-500/10 border border-blue-500/20"></span>
						<span class="text-muted-foreground">Holiday</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-3 rounded bg-purple-500/10 border border-purple-500/20"></span>
						<span class="text-muted-foreground">WFH</span>
					</div>
				</div>

				<!-- Weekdays Header -->
				<div class="grid grid-cols-7 gap-2 text-center text-xs font-bold mb-2 uppercase text-muted-foreground tracking-wider">
					{#each weekdays as day}
						<div class="py-2">{day}</div>
					{/each}
				</div>

				<!-- Grid of Days -->
				<div class="grid grid-cols-7 gap-2">
					{#each calendarMonthDays as cell}
						{@const dayStatus = getDayStatus(cell.dateStr)}
						<div
							class={cn(
								"min-h-16 p-2 rounded-lg border border-border/50 flex flex-col justify-between transition-all relative",
								cell.isCurrentMonth ? "bg-card text-foreground" : "bg-muted/10 text-muted-foreground opacity-50",
								cell.isToday && "ring-2 ring-[#F45310] ring-offset-2 ring-offset-background",
								dayStatus ? dayStatus.color : "hover:bg-muted/30"
							)}
						>
							<span class="text-xs font-bold">{cell.day}</span>
							{#if dayStatus}
								<span class="text-[10px] font-semibold tracking-tight uppercase line-clamp-1">{dayStatus.status}</span>
							{/if}
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Employee Specific Table -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle>Attendance History</CardTitle>
				<CardDescription>Scoped log list for the selected employee context.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if isLoadingHistory}
					<div class="text-center py-12 text-muted-foreground font-medium flex items-center justify-center gap-2">
						<LoaderCircleIcon class="size-5 animate-spin text-[#F45310]" />
						Loading records...
					</div>
				{:else}
					<div class="border rounded-md">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead class="font-bold">Date</TableHead>
									<TableHead class="font-bold">Check In</TableHead>
									<TableHead class="font-bold">Check Out</TableHead>
									<TableHead class="font-bold">Duration</TableHead>
									<TableHead class="font-bold">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#if historyRecords.length === 0}
									<TableRow>
										<TableCell colspan={5} class="text-center py-8 text-muted-foreground font-medium">
											No attendance records found for this employee.
										</TableCell>
									</TableRow>
								{:else}
									{#each historyRecords as rec (rec.cuid)}
										<TableRow>
											<TableCell class="font-semibold">{formatDisplayDate(rec.attendance_date)}</TableCell>
											<TableCell>{formatDisplayTime(rec.check_in_time)}</TableCell>
											<TableCell>{formatDisplayTime(rec.check_out_time)}</TableCell>
											<TableCell>{formatDuration(rec.work_duration_minutes)}</TableCell>
											<TableCell>
												<Badge class={`border-none px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(rec.attendance_status)}`}>
													{rec.attendance_status}
												</Badge>
											</TableCell>
										</TableRow>
									{/each}
								{/if}
							</TableBody>
						</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
