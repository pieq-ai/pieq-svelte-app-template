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

	let { data } = $props();

	function handlePeriodChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		goto(`/dashboard/finance?period=${select.value}`, { keepFocus: true, invalidateAll: true });
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

	<!-- Profile header -->
	<section class="flex items-center gap-4 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
		<div class="size-12 rounded-full bg-[#FFF4EE] overflow-hidden flex items-center justify-center border border-[#FFE2D3] text-[#F45310] font-bold text-lg">
			{#if data.employee}
				{data.employee.first_name[0]}{data.employee.last_name[0]}
			{:else}
				FM
			{/if}
		</div>
		<div>
			<h2 class="text-lg font-bold text-neutral-900 leading-tight">
				{#if data.employee}
					{data.employee.first_name} {data.employee.last_name}
				{:else}
					Finance Manager
				{/if}
			</h2>
			<p class="text-xs font-semibold text-neutral-400 mt-0.5">Welcome back! 👋</p>
		</div>
	</section>

	<AttendanceWidget employee={data.employee} activeShift={data.activeShift} todayAttendance={data.todayAttendance} />

	<!-- Metrics Cards Row -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-5">
		<!-- Total Employees -->
		<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-2">
			<div class="flex items-center gap-2 text-neutral-400">
				<UsersIcon class="size-4 shrink-0" />
				<span class="text-xs font-bold uppercase tracking-wider">Total Employees</span>
			</div>
			<div class="text-3xl font-black text-neutral-800">
				{data.stats?.totalEmployees ?? 0}
			</div>
			<div class="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
				<ArrowUpIcon class="size-3.5" />
				<span>+{data.stats?.newEmployeesThisMonth ?? 0} this month</span>
			</div>
		</div>

		<!-- Total Payroll (MTD) -->
		<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-2">
			<div class="flex items-center gap-2 text-neutral-400">
				<WalletIcon class="size-4 shrink-0" />
				<span class="text-xs font-bold uppercase tracking-wider">Total Payroll (MTD)</span>
			</div>
			<div class="text-3xl font-black text-neutral-800">
				{formatIndianCurrency(data.stats?.totalPayroll ?? 0)}
			</div>
			<div class={`flex items-center gap-1 text-[11px] font-bold ${(data.stats?.totalPayrollTrend ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
				{#if (data.stats?.totalPayrollTrend ?? 0) >= 0}
					<ArrowUpIcon class="size-3.5" />
					<span>+{(data.stats?.totalPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{:else}
					<ArrowDownIcon class="size-3.5" />
					<span>{(data.stats?.totalPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{/if}
			</div>
		</div>

		<!-- Net Payroll (MTD) -->
		<div class="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-2">
			<div class="flex items-center gap-2 text-neutral-400">
				<BanknoteIcon class="size-4 shrink-0" />
				<span class="text-xs font-bold uppercase tracking-wider">Net Payroll (MTD)</span>
			</div>
			<div class="text-3xl font-black text-neutral-800">
				{formatIndianCurrency(data.stats?.netPayroll ?? 0)}
			</div>
			<div class={`flex items-center gap-1 text-[11px] font-bold ${(data.stats?.netPayrollTrend ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
				{#if (data.stats?.netPayrollTrend ?? 0) >= 0}
					<ArrowUpIcon class="size-3.5" />
					<span>+{(data.stats?.netPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{:else}
					<ArrowDownIcon class="size-3.5" />
					<span>{(data.stats?.netPayrollTrend ?? 0).toFixed(2)}% vs last month</span>
				{/if}
			</div>
		</div>

		<!-- Holidays -->
		<a href="/holidays" class="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-2 decoration-none block hover:-translate-y-0.5 transition-all duration-200">
			<div class="flex items-center gap-2 text-neutral-400">
				<SparklesIcon class="size-4 shrink-0" />
				<span class="text-xs font-bold uppercase tracking-wider">Holidays</span>
			</div>
			<div class="text-3xl font-black text-neutral-800">
				{String(data.stats?.upcomingHolidaysCount ?? 0).padStart(2, '0')}
			</div>
			<div class="flex items-center gap-1 text-[11px] font-bold text-orange-600">
				<span>View Holiday Calendar</span>
			</div>
		</a>
	</section>

	<!-- Payroll Summary & Pie Chart Section -->
	<section class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-bold text-neutral-900">Payroll Summary</h3>
			
			<!-- Period Selector Dropdown -->
			{#if (data.periods?.length ?? 0) > 0}
				<div class="relative">
					<select
						value={data.selectedPeriodValue}
						onchange={handlePeriodChange}
						class="appearance-none bg-white border border-neutral-200 rounded-xl px-4 py-2 pr-9 text-xs font-bold text-neutral-700 shadow-xs focus:border-neutral-350 focus:outline-none cursor-pointer"
					>
						{#each data.periods ?? [] as period}
							<option value={period.value}>{period.label}</option>
						{/each}
					</select>
					<ChevronDownIcon class="absolute right-3 top-2.5 size-4 pointer-events-none opacity-50" />
				</div>
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
