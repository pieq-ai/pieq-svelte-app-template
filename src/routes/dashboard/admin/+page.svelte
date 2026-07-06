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

  let { data } = $props();

  function handlePeriodChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    goto(`/dashboard/admin?period=${select.value}`, {
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
</script>

<svelte:head>
  <title>Admin Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">
  <!-- Header Area: Dashboard Title, Notification Bell -->
  <header class="flex items-center justify-between py-2">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold tracking-tight text-neutral-900">
        Dashboard
      </h1>
    </div>

    
  </header>

  <!-- Welcome Header Card -->
  <section
    class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs"
  >
    <div class="flex items-center gap-4">
      <div
        class="size-12 rounded-full bg-[#FFF4EE] flex items-center justify-center border border-[#FFE2D3] text-[#F45310] font-black text-lg"
      >
        A
      </div>
      <div>
        <h2 class="text-xl font-bold text-neutral-900 leading-tight">
          Welcome back, Admin! 👋
        </h2>
        <p class="text-xs font-semibold text-neutral-400 mt-1 block">
          Today's Organizational Overview
        </p>
      </div>
    </div>
  </section>

  <AttendanceWidget
    employee={data.employee}
    activeShift={data.activeShift}
    todayAttendance={data.todayAttendance}
  />

  <!-- Metrics Cards (5-columns Grid) -->
  <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <!-- Total Employees -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between text-neutral-400">
        <span class="text-[10px] font-extrabold uppercase tracking-wider"
          >Total Employees</span
        >
        <div
          class="size-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"
        >
          <UsersIcon class="size-3.5 shrink-0" />
        </div>
      </div>
      <div class="text-2xl font-black text-neutral-800">
        {data.stats?.totalEmployees ?? 0}
      </div>
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"
      >
        <ArrowUpIcon class="size-3" />
        <span>{data.stats?.newEmployeesThisMonth ?? 0} this month</span>
      </div>
    </div>

    <!-- Today's Attendance -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between text-neutral-400">
        <span class="text-[10px] font-extrabold uppercase tracking-wider"
          >Today's Attendance</span
        >
        <div
          class="size-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"
        >
          <ClockIcon class="size-3.5 shrink-0" />
        </div>
      </div>
      <div class="text-2xl font-black text-neutral-800">
        {data.bottomStats?.presentToday ?? 0}
        <span class="text-neutral-300 font-semibold text-lg"
          >/ {data.stats?.totalEmployees ?? 0}</span
        >
      </div>
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"
      >
        <span
          >{(data.bottomStats?.attendancePercentage ?? 0).toFixed(1)}% Present</span
        >
      </div>
    </div>

    <!-- Departments -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between text-neutral-400">
        <span class="text-[10px] font-extrabold uppercase tracking-wider"
          >Departments</span
        >
        <div
          class="size-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"
        >
          <Building2Icon class="size-3.5 shrink-0" />
        </div>
      </div>
      <div class="text-2xl font-black text-neutral-800">
        {data.stats?.departmentsCount ?? 0}
      </div>
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-neutral-400"
      >
        <span>— No change</span>
      </div>
    </div>

    <!-- Total Payroll (MTD) -->
    <div
      class="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between text-neutral-400">
        <span class="text-[10px] font-extrabold uppercase tracking-wider"
          >Total Payroll (MTD)</span
        >
        <div
          class="size-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"
        >
          <WalletIcon class="size-3.5 shrink-0" />
        </div>
      </div>
      <div
        class="text-base font-black text-neutral-800 truncate"
        title={formatIndianCurrency(data.stats?.totalPayroll ?? 0)}
      >
        {formatIndianCurrency(data.stats?.totalPayroll ?? 0)}
      </div>
      <div
        class={`flex items-center gap-0.5 text-[10px] font-bold ${(data.stats?.totalPayrollTrend ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}
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
      class="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs space-y-2 decoration-none block hover:-translate-y-0.5 transition-all duration-200"
    >
      <div class="flex items-center justify-between text-neutral-400">
        <span class="text-[10px] font-extrabold uppercase tracking-wider"
          >Holidays</span
        >
        <div
          class="size-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"
        >
          <SparklesIcon class="size-3.5 shrink-0" />
        </div>
      </div>
      <div class="text-2xl font-black text-neutral-800">
        {String(data.stats?.upcomingHolidaysCount ?? 0).padStart(2, '0')}
      </div>
      <div
        class="flex items-center gap-0.5 text-[10px] font-bold text-orange-600"
      >
        <span>View Holiday Calendar</span>
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
            <ChevronDownIcon
              class="absolute right-3 top-2.5 size-4 pointer-events-none opacity-50"
            />
          </div>
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
          class="flex flex-col md:flex-row items-center justify-around gap-6 py-2"
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
              <span class="text-[9px] font-bold text-neutral-800"
                >{formatAbbreviatedCurrency(
                  data.stats?.totalPayroll ?? 0,
                )}</span
              >
              <span
                class="text-[8px] font-bold text-neutral-400 uppercase tracking-wide mt-0.5"
                >Total Payroll</span
              >
            </div>
          </div>

          <!-- Legend -->
          <div class="flex-1 space-y-2.5 w-full">
            {#each segments as seg}
              <div
                class="flex items-center justify-between border-b border-neutral-100 pb-1 text-xs"
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
          href="/attendance"
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
