<script lang="ts">
  import AttendanceWidget from "$lib/components/common/AttendanceWidget.svelte";
  import DashboardHeader from "$lib/components/dashboard/DashboardHeader.svelte";
  import DashboardSummaryCard from "$lib/components/dashboard/DashboardSummaryCard.svelte";
  import ShiftDetailsWidget from "$lib/components/dashboard/ShiftDetailsWidget.svelte";
  import QuickActionsWidget from "$lib/components/dashboard/QuickActionsWidget.svelte";
  import HolidayCalendarWidget from "$lib/components/dashboard/HolidayCalendarWidget.svelte";

  // Lucide Icons
  import UsersIcon from "@lucide/svelte/icons/users";
  import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
  import UmbrellaIcon from "@lucide/svelte/icons/umbrella";
  import MessageSquareMoreIcon from "@lucide/svelte/icons/message-square-more";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import UserIcon from "@lucide/svelte/icons/user";

  let { data } = $props();

  function formatTimeOnly(dateStr: string | null | undefined): string {
    if (!dateStr) return "--:--";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Quick actions for Manager
  const managerActions = $derived([
    { href: "/shift-assignments", label: "Shift Assignment", Icon: LayoutGridIcon },
    { href: "/leaves", label: "Apply Leave", Icon: UmbrellaIcon },
    { href: data.latestPayrollCuid ? `/payroll-records/${data.latestPayrollCuid}/payslip` : undefined, label: "Payslip", Icon: FileTextIcon, disabled: !data.latestPayrollCuid },
    { href: "/attendance", label: "Attendance", Icon: ClockIcon },
    { href: `/employees/${data.employee.cuid}`, label: "Profile", Icon: UserIcon }
  ]);
</script>

<svelte:head>
  <title>Manager Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">

  <!-- 1. Header Area -->
  <header class="flex items-center justify-between py-2">
  </header>

  {#if data.employee}
    {#if data.managerContext}
      <!-- 2. Greeting Section & Reporting Manager block -->
      {#snippet actionsSnippet()}
        <div class="flex items-center gap-3">
          <a
            href="/leaves"
            class="flex items-center gap-2 bg-[#F45310] hover:bg-[#D8420B] text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-colors decoration-none"
          >
            <PlusIcon class="size-4" />
            <span>Approve Requests</span>
          </a>
        </div>
      {/snippet}

      <DashboardHeader
        employee={data.employee}
        customBadges={[`Team: ${data.managerContext.teamName}`]}
        actions={actionsSnippet}
      />

      <!-- 3. Attendance Widget -->
      <AttendanceWidget employee={data.employee} activeShift={data.activeShift} todayAttendance={data.todayAttendance} />

      <!-- 4. Summary Cards Grid -->
      <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <DashboardSummaryCard value={data.managerContext.metrics.totalMembers} label="Team Members" Icon={UsersIcon} />
        <DashboardSummaryCard value={data.managerContext.metrics.present} label="Present" Icon={CheckCircle2Icon} />
        <DashboardSummaryCard value={data.managerContext.metrics.onLeave} label="On Leave" Icon={UmbrellaIcon} />
        <DashboardSummaryCard value={data.managerContext.metrics.approvals} label="Approvals" Icon={MessageSquareMoreIcon} valueColor="text-[#F45310]" />
        <DashboardSummaryCard value={String(data.managerContext.metrics.holidays).padStart(2, "0")} label="Holidays" Icon={SparklesIcon} valueColor="text-[#F45310]" href="/holidays" />
      </section>

      <!-- 5. Main Workspace Grid (3 Equal Columns - Exact Employee Dashboard Blueprint) -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ShiftDetailsWidget activeShift={data.activeShift} />
        <QuickActionsWidget actions={managerActions} />
        <HolidayCalendarWidget events={data.managerContext.events} />
      </section>

      <!-- 6. Role-Specific Section (Placed Below Main Workspace Grid) -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 2 Columns (Team Attendance and Leave Requests tables) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Team Daily Attendance Table -->
          <div class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-bold text-neutral-900">
                Team Daily Attendance
              </h3>
              <button
                class="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors border-none bg-transparent cursor-pointer"
                aria-label="Filter list"
              >
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
                        {#if team.status === "Present"}
                          <span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Present
                          </span>
                        {:else if team.status === "Half Day"}
                          <span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                            Half Day
                          </span>
                        {:else if team.status === "WFH"}
                          <span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            WFH
                          </span>
                        {:else if team.status === "On Leave"}
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
                      <td colspan="4" class="py-8 text-center text-xs text-neutral-400 font-semibold">
                        No subordinate attendance logs today.
                      </td>
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
              <a
                href="/leaves"
                class="text-xs font-bold text-[#F45310] hover:underline flex items-center gap-1 decoration-none"
              >
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
                        {#if req.status === "Approved"}
                          <span class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Approved
                          </span>
                        {:else if req.status === "Rejected"}
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
                      <td colspan="4" class="py-8 text-center text-xs text-neutral-400 font-semibold">
                        No recent leave requests.
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right 1 Column (Today's Presence) -->
        <div class="space-y-6">
          <div class="bg-[#F45310] rounded-2xl p-6 text-white shadow-xs flex flex-col justify-between min-h-[220px]">
            <div>
              <h3 class="text-lg font-bold text-white mb-6">
                Today's Presence
              </h3>
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
                    <span>Absent</span>
                  </div>
                  <span class="text-base font-extrabold">{data.managerContext.todayPresence.absent}</span>
                </li>
              </ul>
            </div>

            <div class="pt-6">
              <a
                href="/attendance"
                class="w-full flex items-center justify-center py-2.5 bg-white text-[#F45310] text-xs font-bold rounded-xl shadow-xs hover:bg-neutral-50 transition-colors decoration-none"
              >
                View Attendance
              </a>
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
        Admin <span class="ml-2 px-2.5 py-0.5 bg-[#F45310]/10 text-[#F45310] rounded-full text-[10px] font-extrabold uppercase tracking-wider">Restricted</span>
      </h3>
      <p class="text-xs font-semibold text-neutral-400 m-0">
        Visible only when the Keycloak token includes the <code class="bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded text-[10px] text-neutral-600 font-mono">admin</code> role.
      </p>
    </section>
  {/if}
</div>
