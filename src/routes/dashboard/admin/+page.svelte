<script lang="ts">
  import { goto } from "$app/navigation";
  import AttendanceWidget from "$lib/components/common/AttendanceWidget.svelte";
  import DashboardHeader from "$lib/components/dashboard/DashboardHeader.svelte";
  import DashboardSummaryCard from "$lib/components/dashboard/DashboardSummaryCard.svelte";
  import ShiftDetailsWidget from "$lib/components/dashboard/ShiftDetailsWidget.svelte";
  import HolidayCalendarWidget from "$lib/components/dashboard/HolidayCalendarWidget.svelte";
  import QuickActionsWidget from "$lib/components/dashboard/QuickActionsWidget.svelte";
  import FilterDropdown from "$lib/components/common/FilterDropdown.svelte";

  // Lucide Icons
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import UsersIcon from "@lucide/svelte/icons/users";
  import WalletIcon from "@lucide/svelte/icons/wallet";
  import PlayIcon from "@lucide/svelte/icons/play";
  import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
  import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import UserPlusIcon from "@lucide/svelte/icons/user-plus";
  import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";

  let { data } = $props();

  function handlePeriodChange(val: string) {
    goto(`/dashboard/admin?period=${val}`, {
      keepFocus: true,
      invalidateAll: true,
    });
  }

  function formatIndianCurrency(num: number): string {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
    return formatted.replace(/\s/g, "").replace(/\u00a0/g, "");
  }

  function formatAbbreviatedCurrency(num: number): string {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)}Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)}Lakh`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(0)}k`;
    }
    return `₹${num}`;
  }

  function getMonthYearLabel(val: string): string {
    const found = data.periods?.find((p: any) => p.value === val);
    return found ? found.label : "This Month";
  }

  // Donut chart segments calculation
  const segments = $derived.by(() => {
    const breakdown = data.breakdown ?? {};
    const list = [
      {
        label: "Basic Salary",
        val: breakdown.basicSalary ?? 0,
        pct: breakdown.basicPercent ?? 0,
        color: "#2563EB",
      },
      {
        label: "Allowances",
        val: breakdown.allowances ?? 0,
        pct: breakdown.allowancesPercent ?? 0,
        color: "#10B981",
      },
      {
        label: "Deductions",
        val: breakdown.deductions ?? 0,
        pct: breakdown.deductionsPercent ?? 0,
        color: "#F59E0B",
      },
      {
        label: "Bonuses",
        val: breakdown.bonuses ?? 0,
        pct: breakdown.bonusesPercent ?? 0,
        color: "#8B5CF6",
      },
      {
        label: "Others",
        val: breakdown.others ?? 0,
        pct: breakdown.othersPercent ?? 0,
        color: "#06B6D4",
      },
    ];

    let cumulativePct = 0;
    const C = 2 * Math.PI * 50; // Circumference = 314.159
    return list.map((item) => {
      const dashArray = (item.pct / 100) * C;
      const dashOffset = -(cumulativePct / 100) * C;
      cumulativePct += item.pct;
      return {
        ...item,
        dashArray,
        dashOffset,
      };
    });
  });

  // Admin Quick Actions (matching Employee standard style)
  const adminActions = $derived([
    { href: "/employees/create", label: "Add Employee", Icon: UserPlusIcon },
    { href: "/employees", label: "Manage Employees", Icon: UsersIcon },
    { href: "/role-permissions", label: "Roles & Perms", Icon: ShieldCheckIcon },
    { href: "/attendance-records", label: "Attendance", Icon: ClockIcon },
    { href: "/payrolls", label: "Payroll", Icon: PlayIcon },
    { href: "/settings", label: "Settings", Icon: SettingsIcon }
  ]);
</script>

<svelte:head>
  <title>Admin Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">

  <!-- 1. Header Area -->
  <header class="flex items-center justify-between py-2">
  </header>

  {#if data.employee}
    <!-- 2. Greeting Section & Reporting Manager block -->
    <DashboardHeader employee={data.employee} />
  {/if}

  <!-- 3. Attendance Widget -->
  <AttendanceWidget
    employee={data.employee}
    activeShift={data.activeShift}
    todayAttendance={data.todayAttendance}
  />

  <!-- 4. Summary Cards Grid (5-columns) -->
  <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <!-- Total Employees -->
    {#snippet trendTotalEmployees()}
      <div class="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-2">
        <ArrowUpIcon class="size-3" />
        <span>{data.stats?.newEmployeesThisMonth ?? 0} this month</span>
      </div>
    {/snippet}
    <DashboardSummaryCard value={data.stats?.totalEmployees ?? 0} label="Total Employees" Icon={UsersIcon} trend={trendTotalEmployees} />

    <!-- Today's Attendance -->
    {#snippet trendTodayAttendance()}
      <div class="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-2">
        <span>{(data.bottomStats?.attendancePercentage ?? 0).toFixed(1)}% Present</span>
      </div>
    {/snippet}
    {#snippet valueTodayAttendance()}
      {data.bottomStats?.presentToday ?? 0}<span class="text-neutral-300 font-semibold text-lg">/ {data.stats?.totalEmployees ?? 0}</span>
    {/snippet}
    <DashboardSummaryCard value={valueTodayAttendance} label="Today's Attendance" Icon={ClockIcon} trend={trendTodayAttendance} />

    <!-- Departments -->
    {#snippet trendDepartments()}
      <div class="flex items-center gap-0.5 text-[10px] font-bold text-neutral-400 mt-2">
        <span>— No change</span>
      </div>
    {/snippet}
    <DashboardSummaryCard value={data.stats?.departmentsCount ?? 0} label="Departments" Icon={Building2Icon} trend={trendDepartments} />

    <!-- Total Payroll (MTD) -->
    {#snippet trendTotalPayroll()}
      <div class="flex items-center gap-0.5 text-[10px] font-bold mt-2 {(data.stats?.totalPayrollTrend ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
        {#if (data.stats?.totalPayrollTrend ?? 0) >= 0}
          <ArrowUpIcon class="size-3" />
          <span>+{(data.stats?.totalPayrollTrend ?? 0).toFixed(1)}% vs last month</span>
        {:else}
          <ArrowDownIcon class="size-3" />
          <span>{(data.stats?.totalPayrollTrend ?? 0).toFixed(1)}% vs last month</span>
        {/if}
      </div>
    {/snippet}
    <DashboardSummaryCard value={formatIndianCurrency(data.stats?.totalPayroll ?? 0)} label="Total Payroll (MTD)" Icon={WalletIcon} trend={trendTotalPayroll} />

    <!-- Holidays -->
    {#snippet trendHolidays()}
      <div class="flex items-center gap-0.5 text-[10px] font-bold text-orange-600 mt-2">
        <span>View Calendar</span>
      </div>
    {/snippet}
    <DashboardSummaryCard value={String(data.stats?.upcomingHolidaysCount ?? 0).padStart(2, '0')} label="Holidays" Icon={SparklesIcon} valueColor="text-[#F45310]" href="/holidays" trend={trendHolidays} />
  </section>

  <!-- 5. Main Workspace Grid (3 Equal Columns - Exact Employee Dashboard Blueprint) -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <ShiftDetailsWidget activeShift={data.activeShift} />
    <QuickActionsWidget actions={adminActions} />
    <HolidayCalendarWidget events={data.upcomingEvents} />
  </section>

  <!-- 6. Role-Specific Section (Placed Below Main Workspace Grid) -->
  <section class="w-full">
    <!-- Payroll Summary Chart -->
    <div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-start gap-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-neutral-900 mb-5">Payroll Summary</h3>

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
          <p class="text-sm font-semibold text-neutral-400">
            No payroll data found for this period.
          </p>
        </div>
      {:else}
        <div class="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 py-4 w-full">
          <!-- SVG Donut -->
          <div class="relative flex items-center justify-center size-44 shrink-0">
            <svg class="size-40" viewBox="0 0 120 120">
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
            <div class="absolute flex flex-col items-center justify-center text-center">
              <span class="text-sm font-extrabold text-neutral-800">
                {formatAbbreviatedCurrency(data.stats?.totalPayroll ?? 0)}
              </span>
              <span class="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mt-0.5">Total Payroll</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex-1 max-w-sm space-y-3 w-full">
            {#each segments as seg}
              <div class="flex items-center justify-between border-b border-neutral-100 pb-1.5 text-xs">
                <div class="flex items-center gap-2">
                  <span class="size-2 rounded-full shrink-0" style="background-color: {seg.color}"></span>
                  <span class="font-bold text-neutral-600">{seg.label}</span>
                </div>
                <div class="font-bold text-neutral-800">
                  {formatIndianCurrency(seg.val)}
                  <span class="text-[10px] text-neutral-400 font-semibold ml-1">({seg.pct.toFixed(1)}%)</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </section>
</div>
