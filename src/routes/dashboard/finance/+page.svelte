<script lang="ts">
	import { goto } from '$app/navigation';
	import AttendanceWidget from '$lib/components/common/AttendanceWidget.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import UsersIcon from '@lucide/svelte/icons/users';
	import WalletIcon from '@lucide/svelte/icons/wallet';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import FilterDropdown from '$lib/components/common/FilterDropdown.svelte';

	let { data } = $props();

	function handlePeriodChange(val: string) {
		goto(`/dashboard/finance?period=${val}`, { keepFocus: true, invalidateAll: true });
	}

	function formatIndianCurrency(num: number): string {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(num);
	}

	function formatAbbreviatedCurrency(num: number): string {
		if (num >= 10000000) {
			return `₹${(num / 10000000).toFixed(2)} Cr`;
		}
		if (num >= 100000) {
			return `₹${(num / 100000).toFixed(2)} Lakh`;
		}
		if (num >= 1000) {
			return `₹${(num / 1000).toFixed(0)}k`;
		}
		return `₹${num}`;
	}

	function getMonthYearLabel(val: string): string {
		const found = data.periods?.find((p: any) => p.value === val);
		return found ? found.label : 'This Month';
	}

	// Donut chart segments calculation
	const segments = $derived.by(() => {
		const breakdown = data.breakdown ?? {};
		const list = [
			{ label: 'Basic Salary', val: breakdown.basicSalary ?? 0, pct: breakdown.basicPercent ?? 0, color: '#2563EB' },
			{ label: 'Allowances', val: breakdown.allowances ?? 0, pct: breakdown.allowancesPercent ?? 0, color: '#10B981' },
			{ label: 'Deductions', val: breakdown.deductions ?? 0, pct: breakdown.deductionsPercent ?? 0, color: '#F59E0B' },
			{ label: 'Bonuses', val: breakdown.bonuses ?? 0, pct: breakdown.bonusesPercent ?? 0, color: '#8B5CF6' }
		];

		// Calculate dashArray and dashOffset for SVG circle drawing
		let cumulativePct = 0;
		const C = 2 * Math.PI * 50; // Circumference = 314.159
		return list.map(item => {
			const dashArray = (item.pct / 100) * C;
			const dashOffset = - (cumulativePct / 100) * C;
			cumulativePct += item.pct;
			return {
				...item,
				dashArray,
				dashOffset
			};
		});
	});

	// Dynamic Greeting based on time of day
	const currentHour = new Date().getHours();
	const greeting = currentHour < 12 ? 'Good Morning' : (currentHour < 17 ? 'Good Afternoon' : 'Good Evening');

	const formattedTodayDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
</script>

<svelte:head>
	<title>Finance Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">

	<!-- Header Area: Dashboard Title, Notification Bell -->
	<header class="flex items-center justify-between py-2">
		<div class="flex items-center gap-4">
			<h1 class="text-xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
		</div>

		<div class="flex items-center gap-4 mr-12">
			<a
				href="/payrolls"
				class="inline-flex items-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors decoration-none"
			>
				Run Payroll
			</a>
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
	{/if}

	<AttendanceWidget employee={data.employee} activeShift={data.activeShift} todayAttendance={data.todayAttendance} />

	<!-- Metrics Cards Row -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-5">
		<!-- Total Employees -->
		<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs">
			<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
				<UsersIcon class="size-5" />
			</div>
			<span class="text-3xl font-extrabold text-neutral-900 mt-3">{data.stats?.totalEmployees ?? 0}</span>
			<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Total Employees</span>
			<div class="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-2">
				<ArrowUpIcon class="size-3" />
				<span>{data.stats?.newEmployeesThisMonth ?? 0} this month</span>
			</div>
		</div>

		<!-- Total Payroll (MTD) -->
		<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs">
			<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
				<WalletIcon class="size-5" />
			</div>
			<span class="text-2xl font-extrabold text-neutral-900 mt-3 truncate w-full" title={formatIndianCurrency(data.stats?.totalPayroll ?? 0)}>
				{formatIndianCurrency(data.stats?.totalPayroll ?? 0)}
			</span>
			<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Total Payroll (MTD)</span>
			<div class={`flex items-center gap-0.5 text-[10px] font-bold mt-2 ${(data.stats?.totalPayrollTrend ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
				{#if (data.stats?.totalPayrollTrend ?? 0) >= 0}
					<ArrowUpIcon class="size-3" />
					<span>+{(data.stats?.totalPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{:else}
					<ArrowDownIcon class="size-3" />
					<span>{(data.stats?.totalPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{/if}
			</div>
		</div>

		<!-- Net Payroll (MTD) -->
		<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs">
			<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
				<BanknoteIcon class="size-5" />
			</div>
			<span class="text-2xl font-extrabold text-neutral-900 mt-3 truncate w-full" title={formatIndianCurrency(data.stats?.netPayroll ?? 0)}>
				{formatIndianCurrency(data.stats?.netPayroll ?? 0)}
			</span>
			<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Net Payroll (MTD)</span>
			<div class={`flex items-center gap-0.5 text-[10px] font-bold mt-2 ${(data.stats?.netPayrollTrend ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
				{#if (data.stats?.netPayrollTrend ?? 0) >= 0}
					<ArrowUpIcon class="size-3" />
					<span>+{(data.stats?.netPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{:else}
					<ArrowDownIcon class="size-3" />
					<span>{(data.stats?.netPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{/if}
			</div>
		</div>

		<!-- Holidays -->
		<a href="/holidays" class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs decoration-none cursor-pointer">
			<div class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]">
				<SparklesIcon class="size-5" />
			</div>
			<span class="text-3xl font-extrabold text-[#F45310] mt-3">
				{String(data.stats?.upcomingHolidaysCount ?? 0).padStart(2, '0')}
			</span>
			<span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5">Holidays</span>
			<div class="flex items-center gap-1 text-[10px] font-bold text-orange-600 mt-2">
				<span>View Calendar</span>
			</div>
		</a>
	</section>

	<!-- Payroll Summary & Pie Chart Section -->
	<section class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-bold text-neutral-900">Payroll Summary</h3>
			
			<!-- Period Selector Dropdown -->
			{#if (data.periods?.length ?? 0) > 0}
				<FilterDropdown
					id="period_selector"
					name="period_selector"
					value={data.selectedPeriodValue}
					onChange={handlePeriodChange}
					options={data.periods}
					Icon={ChevronDownIcon}
					triggerClass="w-[180px] h-9 border border-neutral-200 rounded-xl px-4 py-2 text-xs font-bold text-neutral-700 shadow-xs hover:bg-neutral-50/50 cursor-pointer"
				/>
			{/if}
		</div>

		{#if (data.stats?.totalPayroll ?? 0) === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<p class="text-sm font-semibold text-neutral-400">No payroll data found for {getMonthYearLabel(data.selectedPeriodValue)}.</p>
				<a
					href="/payrolls"
					class="mt-4 inline-flex items-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors decoration-none"
				>
					Upload Payroll
				</a>
			</div>
		{:else}
			<div class="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
				<!-- SVG Donut Chart -->
				<div class="relative flex items-center justify-center size-52">
					<svg class="size-48" viewBox="0 0 120 120">
						<circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" stroke-width="12" />
						{#each segments as seg}
							{#if seg.pct > 0}
								<circle
									cx="60"
									cy="60"
									r="50"
									fill="none"
									stroke={seg.color}
									stroke-width="12"
									stroke-dasharray="{seg.dashArray} 314.16"
									stroke-dashoffset={seg.dashOffset}
									transform="rotate(-90 60 60)"
									class="transition-all duration-500 ease-out"
								/>
							{/if}
						{/each}
					</svg>
					<!-- Inner Text -->
					<div class="absolute flex flex-col items-center justify-center text-center">
						<span class="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Total Payroll</span>
						<span class="text-sm font-black text-neutral-800 mt-0.5">{formatAbbreviatedCurrency(data.stats?.totalPayroll ?? 0)}</span>
					</div>
				</div>

				<!-- Legend & Values -->
				<div class="w-full md:w-1/2 space-y-4">
					{#each segments as seg}
						<div class="flex items-center justify-between border-b border-neutral-100 pb-2">
							<div class="flex items-center gap-3">
								<span class="size-3 rounded-full shrink-0" style="background-color: {seg.color}"></span>
								<span class="text-sm font-bold text-neutral-600">{seg.label}</span>
							</div>
							<div class="text-right">
								<span class="text-sm font-black text-neutral-800">{formatIndianCurrency(seg.val)}</span>
								<span class="text-xs font-semibold text-neutral-400 ml-1.5">({seg.pct.toFixed(2)}%)</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</section>



	<!-- Recent Reports Section -->
	<section class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-base font-bold text-neutral-900">Recent Reports</h3>
			<a href="/payrolls" class="text-xs font-bold text-[#F45310] hover:text-[#D8420B] transition-colors decoration-none">View All</a>
		</div>

		{#if (data.recentReports?.length ?? 0) === 0}
			<p class="text-xs font-semibold text-neutral-400 text-center py-6">No recent payroll uploads found.</p>
		{:else}
			<div class="space-y-3">
				{#each data.recentReports ?? [] as report}
					<a
						href="/payrolls/{report.cuid}"
						class="flex items-center justify-between p-3.5 border border-neutral-150 rounded-xl hover:bg-neutral-50 transition-colors group decoration-none"
					>
						<div class="flex items-center gap-3">
							<div class="size-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
								<FileTextIcon class="size-4.5" />
							</div>
							<div>
								<span class="text-xs font-extrabold text-neutral-700 group-hover:text-[#F45310] transition-colors block">{report.name}</span>
								<span class="text-[10px] font-semibold text-neutral-400 mt-0.5 block">Uploaded: {new Date(report.uploadedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
							</div>
						</div>
						<ChevronDownIcon class="-rotate-90 size-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
					</a>
				{/each}
			</div>
		{/if}
	</section>

</div>
