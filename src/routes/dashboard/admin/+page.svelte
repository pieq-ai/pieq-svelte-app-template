<script lang="ts">
  import { goto } from "$app/navigation";
  import AttendanceWidget from "$lib/components/common/AttendanceWidget.svelte";
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
  import FilterDropdown from "$lib/components/common/FilterDropdown.svelte";

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

    // Calculate dashArray and dashOffset for SVG circle drawing
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
  <title>Admin Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">
  <!-- Header Area: Dashboard Title, Notification Bell -->
  <header class="flex items-center justify-between py-2">
    

    
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

  <AttendanceWidget
    employee={data.employee}
    activeShift={data.activeShift}
    todayAttendance={data.todayAttendance}
  />

  <!-- Metrics Cards (5-columns Grid) -->
  <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <!-- Total Employees -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs"
    >
      <div
        class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]"
      >
        <UsersIcon class="size-5" />
      </div>
      <span class="text-3xl font-extrabold text-neutral-900 mt-3"
        >{data.stats?.totalEmployees ?? 0}</span
      >
      <span
        class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
        >Total Employees</span
      >
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-2"
      >
        <ArrowUpIcon class="size-3" />
        <span>{data.stats?.newEmployeesThisMonth ?? 0} this month</span>
      </div>
    </div>

    <!-- Today's Attendance -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs"
    >
      <div
        class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]"
      >
        <ClockIcon class="size-5" />
      </div>
      <div class="text-3xl font-extrabold text-neutral-900 mt-3">
        {data.bottomStats?.presentToday ?? 0}
        <span class="text-neutral-300 font-semibold text-lg"
          >/ {data.stats?.totalEmployees ?? 0}</span
        >
      </div>
      <span
        class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
        >Today's Attendance</span
      >
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-2"
      >
        <span
          >{(data.bottomStats?.attendancePercentage ?? 0).toFixed(1)}% Present</span
        >
      </div>
    </div>

    <!-- Departments -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs"
    >
      <div
        class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]"
      >
        <Building2Icon class="size-5" />
      </div>
      <span class="text-3xl font-extrabold text-neutral-900 mt-3"
        >{data.stats?.departmentsCount ?? 0}</span
      >
      <span
        class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
        >Departments</span
      >
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-neutral-400 mt-2"
      >
      </div>
    </div>

    <!-- Total Payroll (MTD) -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs"
    >
      <div
        class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]"
      >
        <WalletIcon class="size-5" />
      </div>
      <span
        class="text-2xl font-extrabold text-neutral-900 mt-3 truncate w-full"
        title={formatIndianCurrency(data.stats?.totalPayroll ?? 0)}
      >
        {formatIndianCurrency(data.stats?.totalPayroll ?? 0)}
      </span>
      <span
        class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
        >Total Payroll (MTD)</span
      >
      <div
        class={`flex items-center gap-0.5 text-[10px] font-bold mt-2 ${(data.stats?.totalPayrollTrend ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}
      >
        {#if (data.stats?.totalPayrollTrend ?? 0) >= 0}
          <ArrowUpIcon class="size-3" />
          <span
            >+{(data.stats?.totalPayrollTrend ?? 0).toFixed(1)}% vs last month</span
          >
        {:else}
          <ArrowDownIcon class="size-3" />
          <span
            >{(data.stats?.totalPayrollTrend ?? 0).toFixed(1)}% vs last month</span
          >
        {/if}
      </div>
    </div>

    <!-- Holidays -->
    <a
      href="/holidays"
      class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs decoration-none cursor-pointer"
    >
      <div
        class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]"
      >
        <SparklesIcon class="size-5" />
      </div>
      <span class="text-3xl font-extrabold text-[#F45310] mt-3">
        {String(data.stats?.upcomingHolidaysCount ?? 0).padStart(2, '0')}
      </span>
      <span
        class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
        >Holidays</span
      >
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-orange-600 mt-2"
      >
        <span>View Calendar</span>
      </div>
    </a>
  </section>

  <!-- Middle Layout Row: Payroll Summary & Quick Actions -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Payroll Summary Chart -->
    <div
      class="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-start gap-4"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-neutral-900">Payroll Summary</h3>

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
        <div
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <p class="text-sm font-semibold text-neutral-400">
            No payroll data found for this period.
          </p>
        </div>
      {:else}
        <div
          class="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 py-4 w-full"
        >
          <!-- SVG Donut -->
          <div
            class="relative flex items-center justify-center size-44 shrink-0"
          >
            <svg class="size-40" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#f3f4f6"
                stroke-width="12"
              />
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
            <div
              class="absolute flex flex-col items-center justify-center text-center"
            >
              <span class="text-sm font-extrabold text-neutral-800"
                >{formatAbbreviatedCurrency(
                  data.stats?.totalPayroll ?? 0,
                )}</span
              >
              <span
                class="text-[9px] font-bold text-neutral-400 uppercase tracking-wide mt-0.5"
                >Total Payroll</span
              >
            </div>
          </div>

          <!-- Legend -->
          <div class="flex-1 max-w-sm space-y-3 w-full">
            {#each segments as seg}
              <div
                class="flex items-center justify-between border-b border-neutral-100 pb-1.5 text-xs"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="size-2 rounded-full shrink-0"
                    style="background-color: {seg.color}"
                  ></span>
                  <span class="font-bold text-neutral-600">{seg.label}</span>
                </div>
                <div class="font-bold text-neutral-800">
                  {formatIndianCurrency(seg.val)}
                  <span class="text-[10px] text-neutral-400 font-semibold ml-1"
                    >({seg.pct.toFixed(1)}%)</span
                  >
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Quick Actions Widget -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col"
    >
      <h3 class="text-base font-bold text-neutral-900 mb-4">Quick Actions</h3>

      <div class="grid grid-cols-2 gap-3.5 flex-1">
        <!-- Add Employee -->
        <a
          href="/employees/create"
          class="flex flex-col justify-between border border-neutral-150 rounded-xl p-3 hover:bg-[#FFF4EE]/30 hover:border-[#FFE2D3] group transition-all duration-200 decoration-none"
        >
          <div
            class="size-8 rounded-lg bg-[#FFF4EE] text-[#F45310] flex items-center justify-center"
          >
            <UserPlusIcon class="size-4.5" />
          </div>
          <div class="mt-3">
            <span class="text-xs font-extrabold text-neutral-700 block"
              >Add Employee</span
            >
            <span
              class="text-[9px] text-neutral-400 font-medium block mt-0.5 leading-tight"
              >Create new record</span
            >
          </div>
        </a>

        <!-- Manage Employees -->
        <a
          href="/employees"
          class="flex flex-col justify-between border border-neutral-150 rounded-xl p-3 hover:bg-emerald-50/30 hover:border-emerald-100 group transition-all duration-200 decoration-none"
        >
          <div
            class="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"
          >
            <UsersIcon class="size-4.5" />
          </div>
          <div class="mt-3">
            <span class="text-xs font-extrabold text-neutral-700 block"
              >Manage Employees</span
            >
            <span
              class="text-[9px] text-neutral-400 font-medium block mt-0.5 leading-tight"
              >View & edit profiles</span
            >
          </div>
        </a>

        <!-- Roles & Permissions -->
        <a
          href="/role-permissions"
          class="flex flex-col justify-between border border-neutral-150 rounded-xl p-3 hover:bg-indigo-50/30 hover:border-indigo-100 group transition-all duration-200 decoration-none"
        >
          <div
            class="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"
          >
            <ShieldCheckIcon class="size-4.5" />
          </div>
          <div class="mt-3">
            <span class="text-xs font-extrabold text-neutral-700 block"
              >Roles & Perms</span
            >
            <span
              class="text-[9px] text-neutral-400 font-medium block mt-0.5 leading-tight"
              >Set permissions</span
            >
          </div>
        </a>

        <!-- Attendance Overview -->
        <a
          href="/attendance-records"
          class="flex flex-col justify-between border border-neutral-150 rounded-xl p-3 hover:bg-blue-50/30 hover:border-blue-100 group transition-all duration-200 decoration-none"
        >
          <div
            class="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
          >
            <ClockIcon class="size-4.5" />
          </div>
          <div class="mt-3">
            <span class="text-xs font-extrabold text-neutral-700 block"
              >Attendance</span
            >
            <span
              class="text-[9px] text-neutral-400 font-medium block mt-0.5 leading-tight"
              >Overview logs</span
            >
          </div>
        </a>

        <!-- Payroll -->
        <a
          href="/payrolls"
          class="flex flex-col justify-between border border-neutral-150 rounded-xl p-3 hover:bg-amber-50/30 hover:border-amber-100 group transition-all duration-200 decoration-none"
        >
          <div
            class="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"
          >
            <PlayIcon class="size-4.5 ml-0.5" />
          </div>
          <div class="mt-3">
            <span class="text-xs font-extrabold text-neutral-700 block"
              >Payroll</span
            >
            <span
              class="text-[9px] text-neutral-400 font-medium block mt-0.5 leading-tight"
              >Process batches</span
            >
          </div>
        </a>

        <!-- System Settings -->
        <a
          href="/settings"
          class="flex flex-col justify-between border border-neutral-150 rounded-xl p-3 hover:bg-neutral-100/50 group transition-all duration-200 decoration-none"
        >
          <div
            class="size-8 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center"
          >
            <SettingsIcon class="size-4.5" />
          </div>
          <div class="mt-3">
            <span class="text-xs font-extrabold text-neutral-700 block"
              >Settings</span
            >
            <span
              class="text-[9px] text-neutral-400 font-medium block mt-0.5 leading-tight"
              >Global settings</span
            >
          </div>
        </a>
      </div>
    </div>
  </section>
</div>
