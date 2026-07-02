<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import AttendanceWidget from "$lib/components/common/AttendanceWidget.svelte";

  // Lucide Icons
  import ClockIcon from "@lucide/svelte/icons/clock";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import UmbrellaIcon from "@lucide/svelte/icons/umbrella";
  import MessageSquareMoreIcon from "@lucide/svelte/icons/message-square-more";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import UserIcon from "@lucide/svelte/icons/user";
  import BellIcon from "@lucide/svelte/icons/bell";
  import CakeIcon from "@lucide/svelte/icons/cake";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import UsersIcon from "@lucide/svelte/icons/users";
  import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import AwardIcon from "@lucide/svelte/icons/award";

  let { data } = $props();

  // Switcher State
  let isSwitcherOpen = $state(false);

  // Dynamic Greeting based on time of day
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
        ? "Good Afternoon"
        : "Good Evening";

  function getEventMonthName(dateStr: string | Date): string {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  }

  function getEventDay(dateStr: string | Date): string {
    const d = new Date(dateStr);
    return String(d.getDate()).padStart(2, "0");
  }

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

  const formattedTodayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
</script>

<svelte:head>
  <title>Manager Dashboard – PieQ HRMS</title>
</svelte:head>

<div class="bg-[#FAF9F6] -mx-6 -my-6 p-6 min-h-screen space-y-6">
  <!-- Header Area: Dashboard Title, Switcher, Notification Bell -->
  <header class="flex items-center justify-between py-2">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold tracking-tight text-neutral-900">
        Dashboard
      </h1>
    </div>

    <div class="flex items-center gap-4">
      <button
        class="relative p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-600 border-none bg-transparent"
        aria-label="Notifications"
      >
        <BellIcon class="size-5" />
        <span
          class="absolute top-1.5 right-1.5 size-2 bg-[#F45310] rounded-full"
        ></span>
      </button>
    </div>
  </header>

  {#if data.employee}
    {#if data.managerContext}
      <!-- Greeting Section & Action Buttons -->
      <section
        class="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-[#FAF9F6]"
      >
        <div class="space-y-3">
          <h2 class="text-4xl font-bold tracking-tight text-neutral-900">
            {greeting}, {data.employee.first_name}
          </h2>
          <p class="text-sm font-medium text-neutral-500">
            Today is {formattedTodayDate}
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200"
            >
              <UserIcon class="size-3" />
              Manager ID: {data.managerContext.managerId}
            </span>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200"
            >
              <Building2Icon class="size-3" />
              Department: {data.managerContext.departmentName}
            </span>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-700 border border-neutral-200"
            >
              <UsersIcon class="size-3" />
              Team: {data.managerContext.teamName}
            </span>
          </div>
        </div>

        <!-- Quick action buttons on the right -->
        <div class="flex items-center gap-3">
          <a
            href="/leaves"
            class="flex items-center gap-2 bg-[#F45310] hover:bg-[#D8420B] text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-colors decoration-none"
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
      <AttendanceWidget employee={data.employee} activeShift={data.activeShift} todayAttendance={data.todayAttendance} />

      <!-- 5 Metrics Cards Grid -->
      <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- Total Members -->
        <div
          class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200"
        >
          <div
            class="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"
          >
            <UsersIcon class="size-5" />
          </div>
          <span class="text-3xl font-extrabold text-neutral-900 mt-3"
            >{data.managerContext.metrics.totalMembers}</span
          >
          <span
            class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
            >Team Members</span
          >
        </div>

        <!-- Present -->
        <div
          class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200"
        >
          <div
            class="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"
          >
            <CheckCircle2Icon class="size-5" />
          </div>
          <span class="text-3xl font-extrabold text-neutral-900 mt-3"
            >{data.managerContext.metrics.present}</span
          >
          <span
            class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
            >Present</span
          >
        </div>

        <!-- On Leave -->
        <div
          class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200"
        >
          <div
            class="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"
          >
            <UmbrellaIcon class="size-5" />
          </div>
          <span class="text-3xl font-extrabold text-neutral-900 mt-3"
            >{data.managerContext.metrics.onLeave}</span
          >
          <span
            class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
            >On Leave</span
          >
        </div>

        <!-- Approvals -->
        <div
          class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200"
        >
          <div
            class="size-10 rounded-full bg-[#FFF4EE] flex items-center justify-center text-[#F45310]"
          >
            <MessageSquareMoreIcon class="size-5" />
          </div>
          <span class="text-3xl font-extrabold text-[#F45310] mt-3"
            >{String(data.managerContext.metrics.approvals).padStart(
              2,
              "0",
            )}</span
          >
          <span
            class="text-[11px] font-semibold text-[#F45310] uppercase tracking-wider mt-1.5"
            >Approvals</span
          >
        </div>

        <!-- Holidays -->
        <div
          class="bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-xs hover:-translate-y-0.5 transition-all duration-200"
        >
          <div
            class="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"
          >
            <Building2Icon class="size-5" />
          </div>
          <span class="text-3xl font-extrabold text-neutral-900 mt-3"
            >{String(data.managerContext.metrics.holidays).padStart(
              2,
              "0",
            )}</span
          >
          <span
            class="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1.5"
            >Holidays</span
          >
        </div>
      </section>

      <!-- Manager Main Workspace Grid -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Columns (Team Attendance and Leave Requests tables) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Team Daily Attendance Table -->
          <div
            class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs"
          >
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
                  <tr
                    class="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider"
                  >
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
                          <span class="font-bold text-neutral-800"
                            >{team.name}</span
                          >
                          <span class="text-xs text-neutral-400 font-medium"
                            >{team.designation}</span
                          >
                        </div>
                      </td>
                      <td class="py-3.5 font-semibold text-neutral-700">
                        {formatTimeOnly(team.check_in_time)}
                      </td>
                      <td class="py-3.5 font-semibold text-neutral-700">
                        {formatTimeOnly(team.check_out_time)}
                      </td>
                      <td class="py-3.5 text-right">
                        {#if team.status === "On-Time"}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            On-Time
                          </span>
                        {:else if team.status === "Late In"}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100"
                          >
                            Late In
                          </span>
                        {:else if team.status === "WFH"}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            WFH
                          </span>
                        {:else if team.status === "On Leave"}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-100"
                          >
                            On Leave
                          </span>
                        {:else}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-100"
                          >
                            Absent
                          </span>
                        {/if}
                      </td>
                    </tr>
                  {:else}
                    <tr>
                      <td
                        colspan="4"
                        class="py-8 text-center text-xs text-neutral-400 font-semibold"
                        >No subordinate attendance logs today.</td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Leave Requests Table -->
          <div
            class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs"
          >
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
                  <tr
                    class="border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider"
                  >
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
                          <span class="font-bold text-neutral-800"
                            >{req.employeeName}</span
                          >
                          <span class="text-xs text-neutral-400 font-medium"
                            >{req.designation}</span
                          >
                        </div>
                      </td>
                      <td class="py-3.5 text-neutral-600 font-medium"
                        >{req.type}</td
                      >
                      <td class="py-3.5 text-neutral-600 font-medium"
                        >{req.duration}</td
                      >
                      <td class="py-3.5 text-right">
                        {#if req.status === "Approved"}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            Approved
                          </span>
                        {:else if req.status === "Rejected"}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-100"
                          >
                            Rejected
                          </span>
                        {:else}
                          <span
                            class="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100"
                          >
                            Pending
                          </span>
                        {/if}
                      </td>
                    </tr>
                  {:else}
                    <tr>
                      <td
                        colspan="4"
                        class="py-8 text-center text-xs text-neutral-400 font-semibold"
                        >No recent leave requests.</td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Sidebar Stack (Presence chart, actions, events) -->
        <div class="space-y-6">
          <!-- Today's Presence (solid block) -->
          <div
            class="bg-[#F45310] rounded-2xl p-6 text-white shadow-xs flex flex-col justify-between min-h-[220px]"
          >
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
                  <span class="text-base font-extrabold"
                    >{data.managerContext.todayPresence.present}</span
                  >
                </li>
                <li class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="size-2 rounded-full bg-white/50"></span>
                    <span>Absent</span>
                  </div>
                  <span class="text-base font-extrabold"
                    >{(data.managerContext.metrics.totalMembers ?? 0) - (data.managerContext.metrics.present ?? 0)}</span
                  >
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

          <!-- Quick Actions Widget -->
          <div
            class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs"
          >
            <h3 class="text-base font-bold text-neutral-900 mb-4">
              Quick Actions
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <!-- Shift Assignment -->
              <a
                href="/shift-assignments"
                class="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-[#FFF4EE] hover:border-[#FFE2D3] hover:text-[#F45310] transition-all text-neutral-600 group text-center decoration-none"
              >
                <LayoutGridIcon
                  class="size-6 text-neutral-400 group-hover:text-[#F45310] transition-colors"
                />
                <span
                  class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors mt-2 leading-tight"
                  >Shift Assignment</span
                >
              </a>

              <!-- Holiday Calendar -->
              <a
                href="/holidays"
                class="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-[#FFF4EE] hover:border-[#FFE2D3] hover:text-[#F45310] transition-all text-neutral-600 group text-center decoration-none"
              >
                <CalendarIcon
                  class="size-6 text-neutral-400 group-hover:text-[#F45310] transition-colors"
                />
                <span
                  class="text-[11px] font-bold text-neutral-500 group-hover:text-[#F45310] transition-colors mt-2 leading-tight"
                  >Holiday Calendar</span
                >
              </a>
            </div>
          </div>

          <!-- Upcoming Events Widget -->
          <div
            class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs"
          >
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-base font-bold text-neutral-900">
                Upcoming Events
              </h3>
              <a
                href="/holidays"
                class="text-xs font-bold text-[#F45310] hover:underline decoration-none"
                >View Calendar</a
              >
            </div>

            <div class="flex flex-col gap-4">
              {#each data.managerContext.events as event}
                <div
                  class="flex items-center justify-between py-1 first:pt-0 last:pb-0"
                >
                  <div class="flex items-center gap-4">
                    <!-- Left side: Date badge in a soft red background -->
                    <div
                      class="bg-[#FFF0EB] border border-[#FFE2D3] rounded-xl px-2.5 py-1.5 text-center flex flex-col items-center justify-center min-w-[50px]"
                    >
                      <span
                        class="text-[9px] font-extrabold text-[#F45310] leading-none uppercase"
                        >{getEventMonthName(event.date)}</span
                      >
                      <span
                        class="text-base font-extrabold text-[#F45310] leading-none mt-1"
                        >{getEventDay(event.date)}</span
                      >
                    </div>

                    <!-- Middle details -->
                    <div class="space-y-0.5">
                      <p
                        class="text-sm font-bold text-neutral-800 leading-tight"
                      >
                        {event.name}
                      </p>
                      <p
                        class="text-[11px] font-semibold text-neutral-400 tracking-wide"
                      >
                        {event.label}
                      </p>
                    </div>
                  </div>

                  <!-- Right side icon -->
                  <div class="text-neutral-355">
                    {#if event.type === "holiday"}
                      <Building2Icon class="size-5 text-[#FFE2D3]" />
                    {:else if event.type === "birthday"}
                      <CakeIcon class="size-5 text-[#FFE2D3]" />
                    {:else}
                      <AwardIcon class="size-5 text-[#FFE2D3]" />
                    {/if}
                  </div>
                </div>
              {:else}
                <p
                  class="text-xs font-semibold text-neutral-400 text-center py-4"
                >
                  No upcoming events scheduled.
                </p>
              {/each}
            </div>
          </div>
        </div>
      </section>
    {/if}
  {:else}
    <div
      class="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-neutral-500"
    >
      Loading workspace details...
    </div>
  {/if}

  <!-- Admin Restricted Section -->
  {#if data.showAdminSection}
    <section
      class="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs"
    >
      <h3 class="text-sm font-bold text-neutral-900 mb-2">
        Admin <span
          class="ml-2 px-2.5 py-0.5 bg-[#F45310]/10 text-[#F45310] rounded-full text-[10px] font-extrabold uppercase tracking-wider"
          >Restricted</span
        >
      </h3>
      <p class="text-xs font-semibold text-neutral-400 m-0">
        Visible only when the Keycloak token includes the <code
          class="bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded text-[10px] text-neutral-600 font-mono"
          >admin</code
        > role.
      </p>
    </section>
  {/if}
</div>
