<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { SvelteDate } from "svelte/reactivity";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
  import XCircleIcon from "@lucide/svelte/icons/x-circle";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
  import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import CheckIcon from "@lucide/svelte/icons/check";
  import { resolve } from "$app/paths";
  import SearchIcon from "@lucide/svelte/icons/search";
  import XIcon from "@lucide/svelte/icons/x";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { toast } from "$lib/toast";
  import { leavesApi } from "$lib/api/leaves";
  import { UI_CONSTANTS } from "$lib/constants";
  import { ApiError } from "$lib/api/local";
  import {
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Input,
    Label,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    CrudModal,
    Pagination,
    SearchInput,
    TableActions,
    DatePicker,
  } from "$lib/components";
  import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';

  interface LeaveBalance {
    cuid: string;
    leave_type_cuid: string;
    leave_name: string;
    leave_code: string;
    allocated_days: number;
    used_days: number;
    remaining_days: number;
    carried_forward_days: number;
  }

  interface LeaveRequest {
    cuid: string;
    leave_name: string;
    leave_code: string;
    start_date: string | Date;
    end_date: string | Date;
    total_days: number;
    is_half_day: boolean;
    half_day_session: string | null;
    reason: string | null;
    document_url: string | null;
    request_status: string;
    days_from_primary: number;
    days_from_lwp: number;
    days_from_lop: number;
    created_at: string | Date;
  }

  interface LeaveType {
    cuid: string;
    leave_name: string;
    leave_code: string;
    is_paid: boolean;
    requires_approval: boolean;
    policy: {
      annual_limit: number;
      max_per_month: number | null;
      carry_forward_allowed: boolean;
      max_carry_forward_days: number | null;
      document_required: boolean;
      document_required_after_days: number | null;
      min_service_days: number;
      allow_half_day: boolean;
      gender_specific: boolean;
      applicable_gender: string | null;
    } | null;
  }

  interface Employee {
    cuid: string;
    emp_code: string;
    first_name: string;
    last_name: string;
    gender: string | null;
    date_of_joining: string | Date | null;
    relieving_date: string | Date | null;
  }

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // Employee dropdown state — mirrors the Attendance page pattern exactly
  let selectedEmployeeUuid = $state("");
  let empSearchQuery = $state("");

  let selectedEmployee = $derived(
    data.employees.find((emp: any) => emp.uuid === selectedEmployeeUuid) ||
      null,
  );

  let employeeOptions = $derived(
    data.employees.map((emp: any) => ({
      id: emp.uuid,
      label: `${emp.name} (${emp.emp_code})`,
    })),
  );

  let filteredEmployeeOptions = $derived.by(() => {
    const q = empSearchQuery.toLowerCase().trim();
    if (!q) return employeeOptions;
    return employeeOptions.filter((o: any) =>
      o.label.toLowerCase().includes(q),
    );
  });

  function scrollIntoView(node: HTMLElement, condition: boolean) {
    if (condition) {
      setTimeout(() => {
        const parent = node.closest('[data-slot="dropdown-menu-item"]');
        if (parent) {
          parent.scrollIntoView({ block: "nearest", behavior: "auto" });
        } else {
          node.scrollIntoView({ block: "nearest", behavior: "auto" });
        }
      }, 50);
    }
  }

  let balances = $state<LeaveBalance[]>([]);
  let requests = $state<LeaveRequest[]>([]);
  let allActiveLeaveTypes = $state<any[]>([]);
  let leaveTypes = $state<any[]>([]);
  let employee = $state<Employee | null>(null);
  let lopUsed = $state(0);
  let lwpUsed = $state(0);
  let isLoading = $state(false);
  let isSubmitting = $state(false);

  let payrollCutoffDay = $state(25);
  let selectedCutoff = $state(25);
  let isSavingCutoff = $state(false);

  let isManager = $state(false);
  let pendingApprovals = $state<any[]>([]);

  // Remove the $effect that initialized from data.details — data is now loaded
  // client-side after employee selection (same as Attendance page pattern)

  // Views state
  let activeTab = $state<"dashboard" | "requests" | "approvals">("dashboard");

  // Modals State
  let isApplyModalOpen = $state(false);
  let withdrawModalOpen = $state(false);
  let showApplyUnsavedModal = $state(false);

  // Approvals Modals State
  let isDetailsModalOpen = $state(false);
  let selectedApproval = $state<any>(null);
  let approveModalOpen = $state(false);
  let rejectModalOpen = $state(false);
  let approvalToAct = $state<any>(null);
  let isActionSubmitting = $state(false);

  // Form State
  let formLeaveTypeCuid = $state("");
  let formStartDate = $state("");
  let formEndDate = $state("");
  let formIsHalfDay = $state(false);
  let formHalfDaySession = $state<"FN" | "AN">("FN");
  let formReason = $state("");
  let formFileName = $state("");
  let formFileMimeType = $state("");
  let formFileBase64 = $state("");
  let formFileSize = $state(0);
  let formValidationErrors = $state<Record<string, string>>({});
  let formIsTouched = $state(false);
  let formExpectedDeliveryDate = $state("");
  let formIsMiscarriage = $state(false);
  let formChildBirthDate = $state("");

  $effect(() => {
    void [
      formLeaveTypeCuid,
      formStartDate,
      formEndDate,
      formIsHalfDay,
      formHalfDaySession,
      formReason,
      formExpectedDeliveryDate,
      formIsMiscarriage,
      formChildBirthDate,
      formFileBase64,
      formFileSize
    ];

    untrack(() => {
      if (formIsTouched) {
        validateForm();
      }
    });
  });

  // Custom Date Picker states
  let activeDatePicker = $state<string | null>(null);

  const getTodayLocalString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayLocalStr = $derived(getTodayLocalString());

  let holidayDatesSet = $derived(new Set((data.holidays || []).map((h: any) => h.date)));

  function isWeekendUI(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function isHolidayUI(d: Date): boolean {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return holidayDatesSet.has(dateStr);
  }

  function getPayrollCycleForDate(d: Date, cutoff: number): string {
    const dateVal = d.getDate();
    let month = d.getMonth();
    let year = d.getFullYear();

    if (dateVal > cutoff) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${monthNames[month]} ${year} Payroll`;
  }

  let leaveImpactBreakdown = $derived.by(() => {
    if (!formLeaveTypeCuid || !formStartDate) return null;
    const start = new Date(formStartDate + "T00:00:00");
    const code = selectedLeaveType?.leave_code || "";

    if (formIsHalfDay) {
      const activeDates = [new Date(start)];
      const totalActive = 0.5;
      const remaining = getAvailableBalanceForMonth(
        formLeaveTypeCuid,
        code,
        formStartDate,
      );

      let primaryDays = 0.5;
      let lopDays = 0;
      let lwpDays = 0;

      if (code === "LWP") {
        primaryDays = 0.0;
        lwpDays = 0.5;
      } else {
        if (0.5 > remaining) {
          primaryDays = Math.max(0, remaining);
          lopDays = 0.5 - primaryDays;
        }
      }

      const cyclesBreakdown: Record<string, number> = {};
      if (lopDays > 0) {
        const cycle = getPayrollCycleForDate(activeDates[0], payrollCutoffDay);
        cyclesBreakdown[cycle] = lopDays;
      }

      return {
        totalActive,
        primaryDays,
        lopDays,
        lwpDays,
        cyclesBreakdown: Object.entries(cyclesBreakdown).map(
          ([cycle, days]) => ({ cycle, days }),
        ),
      };
    }

    if (!formEndDate) return null;
    const end = new Date(formEndDate + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end)
      return null;

    // Collect working dates and calendar dates
    const workingDates: Date[] = [];
    const calendarDates: Date[] = [];
    const curr = new SvelteDate(start);
    while (curr <= end) {
      calendarDates.push(new Date(curr));
      if (code === "ML" || code === "LWP") {
        workingDates.push(new Date(curr));
      } else {
        if (!isWeekendUI(curr) && !isHolidayUI(curr)) {
          workingDates.push(new Date(curr));
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    let remaining = getAvailableBalanceForMonth(
      formLeaveTypeCuid,
      code,
      formStartDate,
    );

    if (code === "ML") {
      if (formIsMiscarriage) {
        remaining = Math.min(remaining, 28.0);
      } else {
        remaining = Math.min(remaining, 168.0);
      }
    } else if (code === "PL") {
      remaining = Math.min(remaining, 5.0);
    }

    let activeDates = workingDates;
    let totalActive = workingDates.length;
    let primaryDays = totalActive;
    let lopDays = 0;
    let lwpDays = 0;

    if (code === "LWP") {
      primaryDays = 0;
      lwpDays = calendarDates.length;
      totalActive = calendarDates.length;
      activeDates = calendarDates;
    } else {
      if (workingDates.length > remaining) {
        // Insufficient balance, sandwich rule applies!
        primaryDays = Math.max(0, remaining);
        lopDays = calendarDates.length - primaryDays;
        totalActive = calendarDates.length;
        activeDates = calendarDates;
      }
    }

    const cyclesBreakdown: Record<string, number> = {};
    for (let i = 0; i < activeDates.length; i++) {
      const lopDayContribution = Math.max(
        0,
        Math.min(i + 1, totalActive) - Math.max(i, primaryDays),
      );
      if (lopDayContribution > 0) {
        if (code !== "LWP") {
          const cycle = getPayrollCycleForDate(
            activeDates[i],
            payrollCutoffDay,
          );
          cyclesBreakdown[cycle] =
            (cyclesBreakdown[cycle] || 0) + lopDayContribution;
        }
      }
    }

    return {
      totalActive,
      primaryDays,
      lopDays,
      lwpDays,
      cyclesBreakdown: Object.entries(cyclesBreakdown).map(([cycle, days]) => ({
        cycle,
        days,
      })),
    };
  });

  // History Filters & Sorting
  let searchQuery = $state("");
  let statusFilter = $state<string>("all");
  let currentPage = $state(1);
  const pageSize = 10;
  let sortColumn = $state("created_at");
  let sortDirection = $state<"asc" | "desc" | null>("desc");

  // Approvals Filters & Sorting
  let approvalsSearchQuery = $state("");
  let approvalsStatusFilter = $state<string>("pending");
  let approvalsCurrentPage = $state(1);
  const approvalsPageSize = 10;
  let approvalsSortColumn = $state("created_at");
  let approvalsSortDirection = $state<"asc" | "desc" | null>("desc");

  // Modal State for Withdraw
  let requestToWithdraw = $state<LeaveRequest | null>(null);
  let isWithdrawing = $state(false);

  // Form Dirtiness check
  let isFormDirty = $derived(
    formLeaveTypeCuid !== "" ||
      formStartDate !== "" ||
      formEndDate !== "" ||
      formIsHalfDay !== false ||
      formReason !== "" ||
      formFileBase64 !== "",
  );

  // Fetch Data — now accepts employeeCuid directly (same as Attendance page loadEmployeeData)
  async function loadDetails(employeeCuid?: string) {
    const cuid = employeeCuid || selectedEmployeeUuid;
    if (!cuid) return;
    isLoading = true;
    try {
      const res = await leavesApi.getDetails(cuid);
      let dbLeaveTypes: any[] = [];
      if (res && res.data) {
        balances = res.data.balances || [];
        requests = res.data.requests || [];
        employee = res.data.employee || null;
         isManager = res.data.isManager || false;
        pendingApprovals = res.data.pendingApprovals || [];
        payrollCutoffDay = res.data.payroll_cutoff ?? res.data.payrollCutoffDay ?? 25;
        selectedCutoff = payrollCutoffDay;
        lopUsed = res.data.lopUsed || 0;
        lwpUsed = res.data.lwpUsed || 0;
        dbLeaveTypes = res.data.leaveTypes ? [...res.data.leaveTypes] : [];
      }

      const typesRes = await fetch("/api/leave/types");
      let activeTypesFromApi: any[] = [];
      if (typesRes.ok) {
        const typesJson = await typesRes.json();
        activeTypesFromApi = typesJson.data || [];
        allActiveLeaveTypes = activeTypesFromApi;
      }

      // Check if LWP is present in dbLeaveTypes. If not, append fallback LWP type.
      const hasLwp = dbLeaveTypes.some((t: any) => t.leave_code === "LWP");
      if (!hasLwp) {
        const lwpType = activeTypesFromApi.find((t) => t.code === "LWP");
        if (lwpType) {
          dbLeaveTypes.push({
            cuid: lwpType.cuid,
            leave_name: lwpType.name,
            leave_code: lwpType.code,
            is_paid: false,
            requires_approval: lwpType.requires_approval,
            policy: {
              annual_limit: 365,
              max_per_month: null,
              carry_forward_allowed: false,
              max_carry_forward_days: null,
              document_required: false,
              document_required_after_days: null,
              min_service_days: 0,
              allow_half_day: true,
              gender_specific: false,
              applicable_gender: null,
            }
          });
        }
      }
      leaveTypes = dbLeaveTypes;
    } catch (err: any) {
      toast.error(err.message || "Failed to load leave details.");
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  // Trigger leave data load whenever the selected employee changes — mirrors Attendance page $effect pattern
  $effect(() => {
    if (selectedEmployeeUuid) {
      loadDetails(selectedEmployeeUuid);
    } else {
      // Reset all leave state when no employee is selected
      balances = [];
      requests = [];
      allActiveLeaveTypes = [];
      leaveTypes = [];
      employee = null;
      isManager = false;
      pendingApprovals = [];
      payrollCutoffDay = 25;
      selectedCutoff = 25;
      activeTab = "dashboard";
      lopUsed = 0;
      lwpUsed = 0;
    }
  });

  async function saveCutoffDay() {
    const currentVal = parseInt(String(payrollCutoffDay).trim(), 10);
    const selectedVal = parseInt(String(selectedCutoff).trim(), 10);

    if (currentVal === selectedVal) {
      activeDatePicker = null;
      return;
    }

    isSavingCutoff = true;
    activeDatePicker = null;
    try {
      const res = await fetch("/api/leaves/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payroll_cutoff: selectedVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.data?.error || data.error || "Failed to update cutoff setting");
      }
      payrollCutoffDay = data.data.payroll_cutoff;
      selectedCutoff = payrollCutoffDay;
      toast.success(
        `Payroll cutoff day updated to ${payrollCutoffDay}th successfully.`,
      );
      await loadDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to update cutoff setting.");
      console.error(err);
    } finally {
      isSavingCutoff = false;
    }
  }

  onMount(() => {
    // Initial load is now driven by employee selection (same as Attendance page pattern)
    // No SSR data — the $effect above handles loading when selectedEmployeeUuid changes
  });

  // Sort Approvals
  function handleApprovalsSort(column: string) {
    if (approvalsSortColumn === column) {
      if (approvalsSortDirection === "asc") approvalsSortDirection = "desc";
      else if (approvalsSortDirection === "desc") approvalsSortDirection = null;
      else approvalsSortDirection = "asc";
    } else {
      approvalsSortColumn = column;
      approvalsSortDirection = "asc";
    }
  }

  // Filter and Sort Approvals
  let filteredApprovals = $derived.by(() => {
    let result = [...pendingApprovals];

    if (approvalsSearchQuery.trim()) {
      const q = approvalsSearchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.employee_code.toLowerCase().includes(q) ||
          r.leave_name.toLowerCase().includes(q) ||
          (r.reason && r.reason.toLowerCase().includes(q)),
      );
    }

    if (approvalsStatusFilter !== "all") {
      result = result.filter(
        (r) =>
          r.request_status.toLowerCase() ===
          approvalsStatusFilter.toLowerCase(),
      );
    }

    if (approvalsSortDirection && approvalsSortColumn) {
      result.sort((a, b) => {
        const valA = a[approvalsSortColumn as keyof typeof a];
        const valB = b[approvalsSortColumn as keyof typeof b];

        if (valA === null || valA === undefined)
          return approvalsSortDirection === "asc" ? 1 : -1;
        if (valB === null || valB === undefined)
          return approvalsSortDirection === "asc" ? -1 : 1;

        if (
          approvalsSortColumn === "start_date" ||
          approvalsSortColumn === "end_date" ||
          approvalsSortColumn === "created_at"
        ) {
          const dateA = new Date(valA as any).getTime();
          const dateB = new Date(valB as any).getTime();
          return approvalsSortDirection === "asc"
            ? dateA - dateB
            : dateB - dateA;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return approvalsSortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return approvalsSortDirection === "asc" ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return result;
  });

  let paginatedApprovals = $derived(
    filteredApprovals.slice(
      (approvalsCurrentPage - 1) * approvalsPageSize,
      approvalsCurrentPage * approvalsPageSize,
    ),
  );

  // Action triggers
  function openDetailsModal(app: any) {
    selectedApproval = {
      ...app,
      is_own_request: employee
        ? app.employee_code === employee.emp_code
        : false,
      source: "approvals",
    };
    isDetailsModalOpen = true;
  }

  function openApproveConfirm(app: any) {
    approvalToAct = app;
    approveModalOpen = true;
  }

  function openRejectConfirm(app: any) {
    approvalToAct = app;
    rejectModalOpen = true;
  }

  async function executeApprove() {
    if (!approvalToAct) return;
    isActionSubmitting = true;
    try {
      const res = await leavesApi.approveOrRejectLeave(
        approvalToAct.cuid,
        "approve",
        selectedEmployeeUuid,
      );
      if (res) {
        toast.success("Leave request approved successfully.");
        approveModalOpen = false;
        isDetailsModalOpen = false;
        approvalToAct = null;
        await loadDetails();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve leave request.");
      console.error(err);
    } finally {
      isActionSubmitting = false;
    }
  }

  async function executeReject() {
    if (!approvalToAct) return;
    isActionSubmitting = true;
    try {
      const res = await leavesApi.approveOrRejectLeave(
        approvalToAct.cuid,
        "reject",
        selectedEmployeeUuid,
      );
      if (res) {
        toast.success("Leave request rejected successfully.");
        rejectModalOpen = false;
        isDetailsModalOpen = false;
        approvalToAct = null;
        await loadDetails();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reject leave request.");
      console.error(err);
    } finally {
      isActionSubmitting = false;
    }
  }

  // Get selected leave type details
  let selectedLeaveType = $derived(
    leaveTypes.find((t) => t.cuid === formLeaveTypeCuid),
  );

  // Automatically set end date to start date if half day is checked
  $effect(() => {
    if (formIsHalfDay && formStartDate) {
      formEndDate = formStartDate;
    }
    if (selectedLeaveType && !selectedLeaveType.policy?.allow_half_day) {
      formIsHalfDay = false;
    }
  });

  // Calculated Duration (days)
  let computedDuration = $derived(leaveImpactBreakdown ? leaveImpactBreakdown.totalActive : 0);

  let start_date_max = $derived.by(() => {
    if (
      selectedLeaveType?.leave_code === "CL" ||
      selectedLeaveType?.leave_code === "SL"
    ) {
      const d = new Date();
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const monthStr = String(month + 1).padStart(2, "0");
      return `${year}-${monthStr}-${lastDay}`;
    }
    return "";
  });

  let end_date_max = $derived.by(() => {
    if (
      selectedLeaveType?.leave_code === "CL"
    ) {
      if (formStartDate) {
        const start = new Date(formStartDate + "T00:00:00");
        const year = start.getFullYear();
        const month = start.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const monthStr = String(month + 1).padStart(2, "0");
        return `${year}-${monthStr}-${lastDay}`;
      }
      const d = new Date();
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const monthStr = String(month + 1).padStart(2, "0");
      return `${year}-${monthStr}-${lastDay}`;
    }
    return "";
  });

  // Check if document is required for selected leave duration
  let isDocRequired = $derived.by(() => {
    if (!selectedLeaveType || !selectedLeaveType.policy) return false;
    const p = selectedLeaveType.policy;
    if (!p.document_required) return false;
    const reqAfter = p.document_required_after_days ?? 0;
    return computedDuration >= reqAfter;
  });

  function getDaysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  }

  function calculateFractionalMonths(start: Date, end: Date): number {
    if (start > end) return 0;

    let totalMonths = 0;
    let current = new SvelteDate(start);

    while (current <= end) {
      const year = current.getUTCFullYear();
      const month = current.getUTCMonth();

      const startOfMonth = new SvelteDate(Date.UTC(year, month, 1));
      const endOfMonth = new SvelteDate(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      const activeStart = current > startOfMonth ? current : startOfMonth;
      const activeEnd = end < endOfMonth ? end : endOfMonth;

      activeStart.setUTCHours(0, 0, 0, 0);
      activeEnd.setUTCHours(0, 0, 0, 0);

      const activeDays =
        Math.ceil(
          (activeEnd.getTime() - activeStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;
      const monthDays = getDaysInMonth(year, month);

      totalMonths += activeDays / monthDays;

      current = new SvelteDate(Date.UTC(year, month + 1, 1));
    }

    return totalMonths;
  }

  function getAvailableBalanceForMonth(
    leaveTypeCuid: string,
    leaveCode: string,
    startDateStr: string,
  ): number {
    const balance = balances.find((b) => b.leave_type_cuid === leaveTypeCuid);
    if (!balance) return 0;

    if (leaveCode !== "CL" && leaveCode !== "SL") {
      return balance.remaining_days;
    }

    if (!employee || !employee.date_of_joining || !startDateStr) return 0;

    const dateParts = startDateStr.split("-");
    if (dateParts.length !== 3) return 0;
    const targetYear = parseInt(dateParts[0], 10);
    const targetMonth = parseInt(dateParts[1], 10) - 1;
    if (isNaN(targetYear) || isNaN(targetMonth)) return 0;

    const joinDate = new SvelteDate(employee.date_of_joining);
    joinDate.setUTCHours(0, 0, 0, 0);

    const relievingDate = employee.relieving_date
      ? new SvelteDate(employee.relieving_date)
      : null;
    if (relievingDate) {
      relievingDate.setUTCHours(0, 0, 0, 0);
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear();

    const yearStart = new Date(Date.UTC(targetYear, 0, 1));

    let effectiveMonthLimit = targetMonth;
    if (targetYear === currentYear) {
      effectiveMonthLimit = Math.min(targetMonth, now.getUTCMonth());
    } else if (targetYear > currentYear) {
      effectiveMonthLimit = -1;
    }

    let accrued = 0;
    if (effectiveMonthLimit >= 0) {
      // Enforce full-month credit rule for employee joining dates
      const accrualJoinDate = new SvelteDate(joinDate);
      accrualJoinDate.setUTCDate(1);

      const serviceStart =
        accrualJoinDate > yearStart ? accrualJoinDate : yearStart;
      const accrualEnd = new Date(Date.UTC(targetYear, effectiveMonthLimit + 1, 0, 23, 59, 59, 999));
      const serviceEnd =
        relievingDate && relievingDate < accrualEnd
          ? relievingDate
          : accrualEnd;

      if (serviceStart <= serviceEnd) {
        const monthsAccrued = calculateFractionalMonths(
          serviceStart,
          serviceEnd,
        );
        const typeObj = leaveTypes.find((t) => t.cuid === leaveTypeCuid);
        const annualLimit =
          typeObj && typeObj.policy ? Number(typeObj.policy.annual_limit) : 6.0;
        const monthlyCredit = annualLimit / 12;
        accrued = Math.min(annualLimit, monthsAccrued * monthlyCredit);
      }
    }

    const carriedForward = balance.carried_forward_days || 0;
    const totalAccrued = accrued + carriedForward;

    // Sum actual CL/SL days deducted from balance up to targetMonth
    const targetMonthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));
    const yearStartGte = new Date(Date.UTC(targetYear, 0, 1));

    const usedUpToMonth = requests
      .filter((r) => {
        if (r.leave_code !== leaveCode || r.request_status !== "approved") {
          return false;
        }
        const rStart = new Date(r.start_date);
        return rStart >= yearStartGte && rStart <= targetMonthEnd;
      })
      .reduce((sum, r) => sum + (r.days_from_primary || 0), 0);

    return Math.max(0.0, totalAccrued - usedUpToMonth);
  }

  // Client-side validations
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    formValidationErrors = {};

    if (!formLeaveTypeCuid) {
      errors.leaveTypeCuid = "Leave type is required";
    }

    if (!formStartDate) {
      errors.startDate = "Start date is required";
    }

    if (!formIsHalfDay && !formEndDate) {
      errors.endDate = "End date is required";
    }

    if (formStartDate && formEndDate) {
      const start = new Date(formStartDate + "T00:00:00");
      const end = new Date(formEndDate + "T00:00:00");
      if (start > end) {
        errors.endDate = "End date cannot be earlier than start date";
      }
    }

    if (!formReason.trim()) {
      errors.reason = "Reason for leave is required";
    } else if (formReason.trim().length < 5) {
      errors.reason = "Reason must be at least 5 characters";
    }

    if (isDocRequired && !formFileBase64) {
      errors.document =
        "A supporting document (image/PDF) is required for this request";
    }

    if (formFileBase64 && formFileSize > 2 * 1024 * 1024) {
      errors.document = "Uploaded document must be less than or equal to 2 MB.";
    }

    // Gender specific validation check
    if (selectedLeaveType?.policy?.gender_specific && employee) {
      const appGender = selectedLeaveType.policy.applicable_gender;
      if (appGender && employee.gender && employee.gender.toLowerCase() !== appGender.toLowerCase()) {
        errors.leaveTypeCuid = `This leave type is only applicable to ${appGender} employees.`;
      }
    }

    // Service days validation check
    if (
      selectedLeaveType?.policy?.min_service_days &&
      employee?.date_of_joining &&
      formStartDate
    ) {
      const joinDate = new Date(employee.date_of_joining);
      const start = new Date(formStartDate);
      const serviceDays =
        (start.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
      const reqDays = selectedLeaveType.policy.min_service_days;
      if (serviceDays < reqDays) {
        errors.leaveTypeCuid = `Minimum service of ${reqDays} days is required for this leave type. You have ${Math.max(0, Math.floor(serviceDays))} days.`;
      }
    }

    // ML Validations
    if (selectedLeaveType?.leave_code === "ML") {
      if (!formExpectedDeliveryDate) {
        errors.expectedDeliveryDate = "Expected Delivery Date is required";
      }
      if (!formFileBase64) {
        errors.document =
          "A supporting medical certificate is mandatory for Maternity Leave";
      }
      if (formExpectedDeliveryDate && formStartDate && !formIsMiscarriage) {
        const edd = new Date(formExpectedDeliveryDate + "T00:00:00");
        const startDate = new Date(formStartDate + "T00:00:00");
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Use leave start date if retroactive, otherwise use today's date
        const requestDate = startDate < today ? startDate : today;

        const minEdd = new SvelteDate(requestDate);
        minEdd.setDate(minEdd.getDate() + 56);

        if (edd < minEdd) {
          errors.expectedDeliveryDate =
            "Maternity Leave request must be submitted at least 8 weeks before expected delivery.";
        }
      }
    }

    // PL Validations
    if (selectedLeaveType?.leave_code === "PL") {
      if (!formChildBirthDate) {
        errors.childBirthDate = "Child Birth Date is required";
      }
    }

    // CL Validations
    if (selectedLeaveType?.leave_code === "CL") {
      if (computedDuration > 2) {
        errors.leaveTypeCuid =
          "Maximum 2 days can be applied in a single Casual Leave request. For longer leaves, please apply using Sick Leave (SL) or Earned Leave (EL) instead.";
      }
    }

    // CL/SL month validations
    if (
      selectedLeaveType?.leave_code === "CL" ||
      selectedLeaveType?.leave_code === "SL"
    ) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      if (formStartDate) {
        const start = new Date(formStartDate + "T00:00:00");
        const isStartFuture =
          start.getFullYear() > currentYear ||
          (start.getFullYear() === currentYear &&
            start.getMonth() > currentMonth);
        if (isStartFuture) {
          errors.startDate =
            "Casual Leave (CL) and Sick Leave (SL) cannot be applied for future months";
        }
      }

      if (selectedLeaveType.leave_code === "CL") {
        if (formEndDate && !formIsHalfDay) {
          const end = new Date(formEndDate + "T00:00:00");
          const isEndFuture =
            end.getFullYear() > currentYear ||
            (end.getFullYear() === currentYear && end.getMonth() > currentMonth);
          if (isEndFuture) {
            errors.endDate =
              "Casual Leave (CL) and Sick Leave (SL) cannot be applied for future months";
          }
        }

        if (formStartDate && formEndDate && !formIsHalfDay) {
          const start = new Date(formStartDate + "T00:00:00");
          const end = new Date(formEndDate + "T00:00:00");
          if (
            start.getFullYear() !== end.getFullYear() ||
            start.getMonth() !== end.getMonth()
          ) {
            errors.endDate =
              "Casual Leave (CL) and Sick Leave (SL) requests cannot span multiple months";
          }
        }
      }
    }

    formValidationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  // Handle file upload selection
  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Limit to 2MB
    const maxFileSize = 2 * 1024 * 1024;
    if (file.size > maxFileSize) {
      formValidationErrors = {
        ...formValidationErrors,
        document: "Uploaded document must be less than or equal to 2 MB.",
      };
      target.value = "";
      formFileName = "";
      formFileMimeType = "";
      formFileBase64 = "";
      formFileSize = 0;
      return;
    }

    // Clear file size error if it exists
    if (
      formValidationErrors.document ===
      "Uploaded document must be less than or equal to 2 MB."
    ) {
      const newErrors = { ...formValidationErrors };
      delete newErrors.document;
      formValidationErrors = newErrors;
    }

    formFileName = file.name;
    formFileMimeType = file.type;
    formFileSize = file.size;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      formFileBase64 = result.split(",")[1] || "";
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }

  // Submit Leave Request
  async function handleApplyLeave(e: Event) {
    e.preventDefault();
    formIsTouched = true;

    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      const payload = {
        employeeCuid: selectedEmployeeUuid,
        leaveTypeCuid: formLeaveTypeCuid,
        startDate: formStartDate,
        endDate: formEndDate,
        isHalfDay: formIsHalfDay,
        halfDaySession: formIsHalfDay ? formHalfDaySession : null,
        reason: formReason.trim(),
        document: formFileBase64
          ? {
              fileName: formFileName,
              mimeType: formFileMimeType,
              base64Data: formFileBase64,
            }
          : null,
        expectedDeliveryDate:
          selectedLeaveType?.leave_code === "ML"
            ? formExpectedDeliveryDate
            : null,
        isMiscarriage:
          selectedLeaveType?.leave_code === "ML" ? formIsMiscarriage : null,
        childBirthDate:
          selectedLeaveType?.leave_code === "PL" ? formChildBirthDate : null,
      };

      const res = await leavesApi.applyLeave(payload);
      if (res && res.data) {
        toast.success("Leave request submitted successfully.");
        closeApplyModal();
        // Reload list & balances
        await loadDetails();
      }
    } catch (err: any) {
      if (err.field) {
        const fieldName = err.field === "documentUrl" ? "document" : err.field;
        formValidationErrors = { [fieldName]: err.message };
      } else if (err instanceof ApiError && err.status === 400) {
        formValidationErrors = { leaveTypeCuid: err.message };
      } else {
        toast.error(err.message || "Failed to submit leave request.");
      }
      console.error(err);
    } finally {
      isSubmitting = false;
    }
  }

  function openApplyModal() {
    formLeaveTypeCuid = "";
    formStartDate = "";
    formEndDate = "";
    formIsHalfDay = false;
    formHalfDaySession = "FN";
    formReason = "";
    formFileName = "";
    formFileMimeType = "";
    formFileBase64 = "";
    formFileSize = 0;
    formIsTouched = false;
    formValidationErrors = {};
    formExpectedDeliveryDate = "";
    formIsMiscarriage = false;
    formChildBirthDate = "";
    isApplyModalOpen = true;
  }

  function closeApplyModal() {
    isApplyModalOpen = false;
    formLeaveTypeCuid = "";
    formStartDate = "";
    formEndDate = "";
    formIsHalfDay = false;
    formHalfDaySession = "FN";
    formReason = "";
    formFileName = "";
    formFileMimeType = "";
    formFileBase64 = "";
    formFileSize = 0;
    formIsTouched = false;
    formValidationErrors = {};
    formExpectedDeliveryDate = "";
    formIsMiscarriage = false;
    formChildBirthDate = "";
  }

  function handleCloseApplyModal() {
    if (isFormDirty) {
      showApplyUnsavedModal = true;
    } else {
      closeApplyModal();
    }
  }

  // Open Confirm Withdraw Modal
  function openWithdrawModal(req: LeaveRequest) {
    requestToWithdraw = req;
    withdrawModalOpen = true;
  }

  // Confirm Withdrawal
  async function confirmWithdraw() {
    if (!requestToWithdraw) return;
    isWithdrawing = true;

    try {
      const res = await leavesApi.withdrawLeave(
        requestToWithdraw.cuid,
        selectedEmployeeUuid,
      );
      if (res) {
        toast.success("Leave request withdrawn successfully.");
        withdrawModalOpen = false;
        isDetailsModalOpen = false;
        requestToWithdraw = null;
        selectedApproval = null;
        await loadDetails();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to withdraw leave request.");
      console.error(err);
    } finally {
      isWithdrawing = false;
    }
  }

  // Sort Requests
  function handleSort(column: string) {
    if (sortColumn === column) {
      if (sortDirection === "asc") sortDirection = "desc";
      else if (sortDirection === "desc") sortDirection = null;
      else sortDirection = "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
  }

  // Filter and Sort Requests
  let filteredRequests = $derived.by(() => {
    let result = [...requests];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.leave_name.toLowerCase().includes(q) ||
          (r.reason && r.reason.toLowerCase().includes(q)),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (r) => r.request_status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    if (sortDirection && sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn as keyof typeof a];
        const valB = b[sortColumn as keyof typeof b];

        if (valA === null || valA === undefined)
          return sortDirection === "asc" ? 1 : -1;
        if (valB === null || valB === undefined)
          return sortDirection === "asc" ? -1 : 1;

        if (
          sortColumn === "start_date" ||
          sortColumn === "end_date" ||
          sortColumn === "created_at"
        ) {
          const dateA = new Date(valA as any).getTime();
          const dateB = new Date(valB as any).getTime();
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return result;
  });

  let paginatedRequests = $derived(
    filteredRequests.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  const cardThemes = {
    EL: { text: "text-hrms-primary" }, // Warm Orange
    CL: { text: "text-emerald-600" }, // Emerald Green
    SL: { text: "text-purple-600" }, // Purple
    ML: { text: "text-pink-600" }, // Pink (Maternity)
    PL: { text: "text-blue-600" }, // Blue (Paternity)
  };

  function formatDate(d: string | Date) {
    if (!d) return "";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    const s = status.toLowerCase();
    if (s === "approved") return "default";
    if (s === "pending") return "outline"; // styled as warning/amber
    if (s === "rejected") return "destructive";
    return "secondary"; // withdrawn
  }

  // Custom Date Picker Helper Functions


  function clickOutsideAction(node: HTMLElement, callback: () => void) {
    const handleClick = (event: MouseEvent) => {
      if (node && !node.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("click", handleClick, true);

    return {
      destroy() {
        document.removeEventListener("click", handleClick, true);
      },
    };
  }

  // Details Modal for own requests
  function openMyDetailsModal(req: any) {
    selectedApproval = {
      ...req,
      employee_name: employee
        ? `${employee.first_name} ${employee.last_name}`.trim()
        : "Logged In Employee",
      employee_code: employee ? employee.emp_code : "EMP-CURRENT",
      is_own_request: true,
      source: "my_leaves",
    };
    isDetailsModalOpen = true;
  }

  // Table custom actions helpers
  const myLeaveActions = (req: LeaveRequest) => {
    const actions = [
      { label: "View Details", onClick: () => openMyDetailsModal(req) },
    ];
    if (req.request_status === "pending") {
      actions.push({
        label: "Withdraw",
        onClick: () => openWithdrawModal(req),
      });
    }
    return actions;
  };

  const approvalActions = (app: any) => {
    const actions = [
      { label: "View Details", onClick: () => openDetailsModal(app) },
    ];
    if (app.request_status === "pending") {
      actions.push({
        label: "Approve",
        onClick: () => openApproveConfirm(app),
      });
      actions.push({ label: "Reject", onClick: () => openRejectConfirm(app) });
    }
    return actions;
  };

  function handleRowClick(e: Event, app: any) {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }
    openDetailsModal(app);
  }

  function handleMyRowClick(e: Event, req: LeaveRequest) {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }
    openMyDetailsModal(req);
  }

  let isAnyModalOpen = $derived(
    isApplyModalOpen ||
      withdrawModalOpen ||
      isDetailsModalOpen ||
      approveModalOpen ||
      rejectModalOpen,
  );

  let summaryBalances = $derived(
    balances.filter((b) => {
      const type = leaveTypes.find((t) => t.cuid === b.leave_type_cuid);
      return !(type?.policy?.gender_specific);
    })
  );
</script>

<!-- Declarative click-outside handlers managed via Svelte actions locally on date pickers -->

<svelte:head>
  <title>Leave Overview</title>
  {#if isApplyModalOpen}
    <style>
      body {
        overflow: auto !important;
        pointer-events: auto !important;
      }
    </style>
  {/if}
</svelte:head>



<div class="w-full space-y-6 px-1 py-0">
  <!-- Page Header matching design system -->
  <div class="space-y-1 border-b border-border pb-6">
    <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
      Leave Overview
    </h1>
  </div>

  <!-- Employee Selector (same pattern as Attendance page) -->
  <Card>
    <CardContent class="p-6">
      <div class="max-w-md space-y-2">
        <Label>Select Employee <span class="text-destructive">*</span></Label>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                variant="outline"
                class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring outline-none"
                {...props}
              >
                <span class="truncate pr-2">
                  {selectedEmployeeUuid
                    ? employeeOptions.find(
                        (o: any) => o.id === selectedEmployeeUuid,
                      )?.label || "Select Employee"
                    : "Select Employee"}
                </span>
                <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            class="w-(--bits-dropdown-menu-anchor-width) max-h-60 overflow-y-auto"
          >
            <div
              class="flex items-center border-b border-border px-3 py-2 bg-transparent"
            >
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
                  onclick={() => (empSearchQuery = "")}
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
                    empSearchQuery = "";
                  }}
                  class="justify-between cursor-pointer {selectedEmployeeUuid ===
                  opt.id
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : ''}"
                >
                  <span class="truncate">{opt.label}</span>
                  {#if selectedEmployeeUuid === opt.id}
                    <CheckIcon class="size-4 shrink-0 text-hrms-primary" />
                  {/if}
                </DropdownMenu.Item>
              {:else}
                <div
                  class="px-3 py-4 text-sm text-muted-foreground text-center"
                >
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
    <div
      class="text-center py-16 border rounded-lg bg-card text-muted-foreground font-medium flex flex-col items-center justify-center gap-3"
    >
      <span>Please select an employee to view their leave dashboard.</span>
    </div>
  {:else}
    <!-- View Switcher Tabs -->
    <div class="flex items-center justify-between border-b border-border pb-px">
      <div class="flex gap-2">
        <button
          type="button"
          class={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer mb-[-2px] ${activeTab === "dashboard" ? "border-hrms-primary text-hrms-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onclick={() => (activeTab = "dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          class={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer mb-[-2px] ${activeTab === "requests" ? "border-hrms-primary text-hrms-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onclick={() => (activeTab = "requests")}
        >
          Leave Requests
        </button>
        {#if isManager}
          <button
            type="button"
            class={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer mb-[-2px] ${activeTab === "approvals" ? "border-hrms-primary text-hrms-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onclick={() => (activeTab = "approvals")}
          >
            Pending Approvals
          </button>
        {/if}
      </div>
      {#if activeTab === "dashboard"}
        <Button
          type="button"
          class="bg-hrms-primary text-white hover:bg-hrms-primary/90 font-bold"
          onclick={openApplyModal}
        >
          Apply Leave
        </Button>
      {/if}
    </div>

    {#if isLoading}
      <div
        class="flex h-64 flex-col items-center justify-center text-muted-foreground"
      >
        <LoaderCircleIcon class="mb-2 size-8 animate-spin text-hrms-primary" />
        <p class="text-sm">Loading leave dashboard...</p>
      </div>
    {:else if activeTab === "dashboard"}
      <!-- View A: Dashboard view -->
      <div class="space-y-6">
        <!-- Summary Cards for SL, CL, EL, LOP & LWP Stats -->
        <div
          class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        >
          {#each summaryBalances as b (b.cuid)}
            {@const theme =
              cardThemes[b.leave_code as keyof typeof cardThemes] ||
              { text: "text-neutral-600" }}
            {@const badgeColor =
              b.leave_code === "EL"
                ? "text-hrms-primary border-hrms-primary/30 bg-orange-50/50"
                : b.leave_code === "CL"
                  ? "text-emerald-600 border-emerald-600/30 bg-emerald-50/50"
                  : b.leave_code === "SL"
                    ? "text-purple-600 border-purple-600/30 bg-purple-50/50"
                    : b.leave_code === "ML"
                      ? "text-pink-600 border-pink-600/30 bg-pink-50/50"
                      : b.leave_code === "PL"
                        ? "text-blue-600 border-blue-600/30 bg-blue-50/50"
                        : "text-neutral-600 border-neutral-600/30 bg-neutral-50/50"}
            <Card
              class="bg-background border border-border/80 shadow-xs rounded-xl"
            >
              <CardHeader
                class="pb-1 pt-4 px-4 flex flex-row items-center justify-between"
              >
                <span class="text-sm font-semibold text-neutral-700"
                  >{b.leave_name}</span
                >
                <Badge
                  variant="outline"
                  class="font-bold text-[10px] {badgeColor}"
                  >{b.leave_code}</Badge
                >
              </CardHeader>
              <CardContent class="pb-4 pt-1 px-4">
                <div
                  class="text-4xl font-extrabold tracking-tight tabular-nums {theme.text}"
                >
                  {b.remaining_days.toFixed(1)}
                </div>
                <p class="text-xs text-muted-foreground mt-1 font-medium">
                  Available Days
                </p>
                <div
                  class="border-t border-border/40 mt-2.5 pt-2 flex justify-between text-xs text-muted-foreground"
                >
                  <span
                    >Quota: <strong class="font-semibold text-foreground"
                      >{b.allocated_days.toFixed(1)}</strong
                    ></span
                  >
                  <span
                    >Used: <strong class="font-semibold text-foreground"
                      >{b.used_days.toFixed(1)}</strong
                    ></span
                  >
                </div>
              </CardContent>
            </Card>
          {/each}

          <!-- Loss of Pay (LOP) Stats Card -->
          <Card
            class="bg-background border border-border/80 shadow-xs rounded-xl"
          >
            <CardHeader
              class="pb-1 pt-4 px-4 flex flex-row items-center justify-between"
            >
              <span class="text-sm font-semibold text-neutral-700"
                >Loss of Pay</span
              >
              <Badge
                variant="outline"
                class="font-bold text-[10px] text-red-600 border-red-600/30 bg-red-50/50"
                >LOP</Badge
              >
            </CardHeader>
            <CardContent class="pb-4 pt-1 px-4">
              <div
                class="text-4xl font-extrabold tracking-tight tabular-nums text-red-600"
              >
                {lopUsed.toFixed(1)}
              </div>
              <p class="text-xs text-muted-foreground mt-1 font-medium">
                LOP Days Incurred
              </p>
            </CardContent>
          </Card>

          <!-- Leave Without Pay (LWP) Stats Card -->
          <Card
            class="bg-background border border-border/80 shadow-xs rounded-xl"
          >
            <CardHeader
              class="pb-1 pt-4 px-4 flex flex-row items-center justify-between"
            >
              <span class="text-sm font-semibold text-neutral-700"
                >Leave Without Pay</span
              >
              <Badge
                variant="outline"
                class="font-bold text-[10px] text-blue-600 border-blue-600/30 bg-blue-50/50"
                >LWP</Badge
              >
            </CardHeader>
            <CardContent class="pb-4 pt-1 px-4">
              <div
                class="text-4xl font-extrabold tracking-tight tabular-nums text-blue-600"
              >
                {lwpUsed.toFixed(1)}
              </div>
              <p class="text-xs text-muted-foreground mt-1 font-medium">
                LWP Days Incurred
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- Payroll Cutoff Configuration Card -->
        <Card class="shadow-sm border border-border/80 overflow-visible">
          <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle
              class="text-base font-bold text-foreground flex items-center gap-2"
            >
              <ClockIcon class="size-4 text-hrms-primary" />
              Payroll Cutoff Configuration
            </CardTitle>
            <CardDescription class="text-xs">
              Monthly payroll cutoff day configuration for Loss of Pay (LOP)
              calculations. LOP days on/before this date belong to the current
              payroll cycle; LOP days after this date belong to the next payroll
              cycle.
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-4 px-4 pb-4 overflow-visible">
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div class="space-y-1">
                <div class="text-sm font-semibold text-foreground">
                  Current Cutoff: <span class="text-hrms-primary font-extrabold"
                    >{payrollCutoffDay}th</span
                  > of every month
                </div>
                <p class="text-xs text-muted-foreground">
                  LOP Payroll Cycle:
                  {#if payrollCutoffDay === 28}
                    1st to 28th of every month.
                  {:else}
                    {payrollCutoffDay + 1}th of previous month to {payrollCutoffDay}th
                    of current month.
                  {/if}
                </p>
              </div>

              {#if isManager}
                <div class="flex items-center gap-2">
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="relative w-28"
                    use:clickOutsideAction={() => {
                      if (activeDatePicker === "payroll_cutoff")
                        activeDatePicker = null;
                    }}
                  >
                    <Button
                      id="payroll_cutoff_select"
                      variant="outline"
                      disabled={isSavingCutoff}
                      onclick={(e) => {
                        if (activeDatePicker === "payroll_cutoff") {
                          activeDatePicker = null;
                        } else {
                          activeDatePicker = "payroll_cutoff";
                        }
                      }}
                      class="flex h-9 w-full justify-between items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer font-semibold"
                    >
                      <span>{selectedCutoff}th</span>
                      <ChevronDownIcon class="size-4 opacity-50 shrink-0" />
                    </Button>

                    {#if activeDatePicker === "payroll_cutoff"}
                      <div
                        class="absolute right-0 top-full z-100 mt-1 w-full min-w-[120px] max-h-56 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none"
                        onclick={(e) => e.stopPropagation()}
                      >
                        {#each Array.from({ length: 28 }, (_, i) => i + 1) as day}
                          <button
                            type="button"
                            class="w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer flex items-center justify-between
														{selectedCutoff === day ? 'bg-accent font-semibold text-hrms-primary' : ''}"
                            onclick={(e) => {
                              e.stopPropagation();
                              selectedCutoff = day;
                              activeDatePicker = null;
                            }}
                          >
                            <span>{day}th</span>
                            {#if selectedCutoff === day}
                              <CheckIcon class="size-3.5 text-hrms-primary" />
                            {/if}
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  <Button
                    type="button"
                    onclick={saveCutoffDay}
                    disabled={isSavingCutoff || parseInt(String(selectedCutoff).trim(), 10) === parseInt(String(payrollCutoffDay).trim(), 10)}
                    class="bg-[#F45310] text-white hover:bg-[#F45310]/90 font-bold"
                  >
                    {#if isSavingCutoff}
                      <LoaderCircleIcon class="mr-2 size-4 animate-spin" />
                      Saving
                    {:else}
                      Save
                    {/if}
                  </Button>
                </div>
              {:else}
                <div
                  class="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/40 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
                >
                  <CheckIcon class="size-3 text-emerald-600" />
                  Read-only View (Manager Access Required)
                </div>
              {/if}
            </div>
          </CardContent>
        </Card>

        <!-- Leave Balance Table (EL, CL, SL only) -->
        <Card class="shadow-sm border border-border/80">
          <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle class="text-lg font-bold text-foreground"
              >Leave Balance Summary</CardTitle
            >
            <CardDescription class="text-xs"
              >Your available leave quotas for the current year. (Maternity
              Leave, Paternity Leave, Leave Without Pay, and Loss of Pay
              balances are excluded from this summary)</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-4 px-4 pb-4">
            <div
              class="rounded-md border border-border overflow-hidden bg-background"
            >
              <Table>
                <TableHeader class="bg-muted/40">
                  <TableRow>
                    <TableHead class="font-bold text-foreground text-xs py-3"
                      >Leave Type</TableHead
                    >
                    <TableHead
                      class="font-bold text-foreground text-xs text-center"
                      >Allocated Days</TableHead
                    >
                    <TableHead
                      class="font-bold text-foreground text-xs text-center"
                      >Used Days</TableHead
                    >
                    <TableHead
                      class="font-bold text-foreground text-xs text-center"
                      >Remaining Days</TableHead
                    >
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each balances as b (b.cuid)}
                    <TableRow class="hover:bg-muted/10 transition-colors">
                      <TableCell class="font-semibold text-xs py-3"
                        >{b.leave_name} ({b.leave_code})</TableCell
                      >
                      <TableCell class="text-xs text-center tabular-nums"
                        >{b.allocated_days.toFixed(1)}</TableCell
                      >
                      <TableCell class="text-xs text-center tabular-nums"
                        >{b.used_days.toFixed(1)}</TableCell
                      >
                      <TableCell
                        class="text-xs text-center font-bold tabular-nums text-foreground"
                        >{b.remaining_days.toFixed(1)}</TableCell
                      >
                    </TableRow>
                  {/each}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    {:else if activeTab === "requests"}
      <!-- View B: My Leave Requests history list -->
      <div class="space-y-3">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <SearchInput
            id="search_leaves"
            name="search_leaves"
            bind:value={searchQuery}
            oninput={() => (currentPage = 1)}
            placeholder="Search requests..."
            class="w-full sm:flex-1"
          />
          <div class="flex items-center gap-2">
            <Label
              for="status_filter"
              class="text-xs text-muted-foreground whitespace-nowrap"
              >Filter Status:</Label
            >
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button
                    id="status_filter"
                    variant="outline"
                    class="h-9 w-32 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent outline-none"
                    {...props}
                  >
                    <span class="truncate capitalize">{statusFilter}</span>
                    <ChevronDownIcon
                      class="ml-1.5 size-4 opacity-50 shrink-0"
                    />
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content class="w-32">
                <DropdownMenu.Group>
                  {#each ["all", "pending", "approved", "rejected", "withdrawn"] as status}
                    <DropdownMenu.Item
                      onclick={() => {
                        statusFilter = status;
                        currentPage = 1;
                      }}
                      class="cursor-pointer justify-between text-xs capitalize {statusFilter ===
                      status
                        ? 'bg-accent font-semibold'
                        : ''}"
                    >
                      {status}
                      {#if statusFilter === status}<CheckIcon
                          class="size-3.5"
                        />{/if}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        <Card class="py-0 border border-border/80 shadow-sm">
          <Table>
            <TableHeader class="bg-muted/40">
              <TableRow>
                <TableHead class="font-bold text-foreground text-xs py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="-ml-2.5 h-8 font-bold text-foreground text-xs"
                    onclick={() => handleSort("leave_name")}
                  >
                    Leave Type
                    {#if sortColumn === "leave_name" && sortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if sortColumn === "leave_name" && sortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead class="font-bold text-foreground text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="-ml-2.5 h-8 font-bold text-foreground text-xs"
                    onclick={() => handleSort("start_date")}
                  >
                    From Date
                    {#if sortColumn === "start_date" && sortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if sortColumn === "start_date" && sortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead class="font-bold text-foreground text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="-ml-2.5 h-8 font-bold text-foreground text-xs"
                    onclick={() => handleSort("end_date")}
                  >
                    To Date
                    {#if sortColumn === "end_date" && sortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if sortColumn === "end_date" && sortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead
                  class="font-bold text-foreground text-xs text-center"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 font-bold text-foreground text-xs mx-auto"
                    onclick={() => handleSort("total_days")}
                  >
                    Total Days
                    {#if sortColumn === "total_days" && sortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if sortColumn === "total_days" && sortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead class="font-bold text-foreground text-xs"
                  >Reason</TableHead
                >
                <TableHead class="font-bold text-foreground text-xs text-center"
                  >Status</TableHead
                >
                <TableHead
                  class="font-bold text-foreground text-xs text-right pr-4"
                  >Actions</TableHead
                >
              </TableRow>
            </TableHeader>
            <TableBody>
              {#if filteredRequests.length === 0}
                <TableRow>
                  <TableCell
                    colspan={7}
                    class="py-12 text-center text-muted-foreground text-sm"
                  >
                    {UI_CONSTANTS.EMPTY_STATE_MESSAGE}
                  </TableCell>
                </TableRow>
              {:else}
                {#each paginatedRequests as req (req.cuid)}
                  <TableRow
                    class="hover:bg-muted/10 transition-colors cursor-pointer"
                    onclick={(e) => handleMyRowClick(e, req)}
                  >
                    <TableCell class="text-xs font-semibold py-3.5">
                      <div class="font-medium">{req.leave_name}</div>
                      {#if req.leave_code !== "LWP" && req.days_from_lwp > 0}
                        <span
                          class="text-[9px] text-orange-600 bg-orange-50 border border-orange-200 rounded px-1 py-0.5 inline-block mt-0.5"
                        >
                          {#if req.days_from_primary === 0}
                            {req.days_from_lwp} LWP
                          {:else}
                            Split: {req.days_from_primary}
                            {req.leave_code} / {req.days_from_lwp} LWP
                          {/if}
                        </span>
                      {/if}
                      {#if req.leave_code !== "LOP" && req.days_from_lop > 0}
                        <span
                          class="text-[9px] text-red-600 bg-red-50 border border-red-200 rounded px-1 py-0.5 inline-block mt-0.5 font-semibold"
                        >
                          {#if req.days_from_primary === 0}
                            {req.days_from_lop} LOP
                          {:else}
                            Split: {req.days_from_primary}
                            {req.leave_code} / {req.days_from_lop} LOP
                          {/if}
                        </span>
                      {/if}
                    </TableCell>
                    <TableCell class="text-xs">
                      {formatDate(req.start_date)}
                    </TableCell>
                    <TableCell class="text-xs">
                      {formatDate(req.end_date)}
                    </TableCell>
                    <TableCell
                      class="text-xs text-center font-bold tabular-nums"
                    >
                      {req.total_days.toFixed(1)}
                      {#if req.is_half_day}
                        <Badge
                          variant="secondary"
                          class="block w-fit text-[9px] py-0 px-1 mt-0.5 mx-auto bg-accent/60"
                          >Half ({req.half_day_session})</Badge
                        >
                      {/if}
                    </TableCell>
                    <TableCell
                      class="text-xs max-w-xs truncate"
                      title={req.reason || ""}
                    >
                      {req.reason || "-"}
                      {#if req.document_url}
                        <a
                          href={resolve(req.document_url as any)}
                          target="_blank"
                          class="inline-flex items-center ml-2 text-xs text-blue-600 hover:underline"
                        >
                          <FileTextIcon class="size-3 mr-0.5" /> Doc
                        </a>
                      {/if}
                    </TableCell>
                    <TableCell class="text-center">
                      <Badge
                        variant={getStatusBadge(req.request_status)}
                        class="capitalize font-bold text-[10px]"
                      >
                        {#if req.request_status === "pending"}
                          <ClockIcon class="mr-1 size-3" />
                        {:else if req.request_status === "approved"}
                          <CheckCircleIcon class="mr-1 size-3" />
                        {:else if req.request_status === "rejected"}
                          <XCircleIcon class="mr-1 size-3" />
                        {:else}
                          <Trash2Icon class="mr-1 size-3" />
                        {/if}
                        {req.request_status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      class="text-right pr-4"
                      onclick={(e) => e.stopPropagation()}
                    >
                      <TableActions
                        canEdit={false}
                        customActions={myLeaveActions(req)}
                      />
                    </TableCell>
                  </TableRow>
                {/each}
              {/if}
            </TableBody>
          </Table>
        </Card>
        <Pagination
          bind:currentPage
          {pageSize}
          totalItems={filteredRequests.length}
        />
      </div>
    {:else if activeTab === "approvals" && isManager}
      <!-- View C: Subordinates Leave Requests (Pending Approvals) -->
      <div class="space-y-3">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <SearchInput
            id="search_approvals"
            name="search_approvals"
            bind:value={approvalsSearchQuery}
            oninput={() => (approvalsCurrentPage = 1)}
            placeholder="Search approvals..."
            class="w-full sm:flex-1"
          />
          <div class="flex items-center gap-2">
            <Label
              for="approvals_status_filter"
              class="text-xs text-muted-foreground whitespace-nowrap"
              >Filter Status:</Label
            >
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button
                    id="approvals_status_filter"
                    variant="outline"
                    class="h-9 w-32 justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent outline-none"
                    {...props}
                  >
                    <span class="truncate capitalize"
                      >{approvalsStatusFilter}</span
                    >
                    <ChevronDownIcon
                      class="ml-1.5 size-4 opacity-50 shrink-0"
                    />
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content class="w-32">
                <DropdownMenu.Group>
                  {#each ["all", "pending", "approved", "rejected"] as status}
                    <DropdownMenu.Item
                      onclick={() => {
                        approvalsStatusFilter = status;
                        approvalsCurrentPage = 1;
                      }}
                      class="cursor-pointer justify-between text-xs capitalize {approvalsStatusFilter ===
                      status
                        ? 'bg-accent font-semibold'
                        : ''}"
                    >
                      {status}
                      {#if approvalsStatusFilter === status}<CheckIcon
                          class="size-3.5"
                        />{/if}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        <Card class="py-0 border border-border/80 shadow-sm">
          <Table>
            <TableHeader class="bg-muted/40">
              <TableRow>
                <TableHead class="font-bold text-foreground text-xs py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="-ml-2.5 h-8 font-bold text-foreground text-xs"
                    onclick={() => handleApprovalsSort("employee_name")}
                  >
                    Employee Name
                    {#if approvalsSortColumn === "employee_name" && approvalsSortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if approvalsSortColumn === "employee_name" && approvalsSortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead class="font-bold text-foreground text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="-ml-2.5 h-8 font-bold text-foreground text-xs"
                    onclick={() => handleApprovalsSort("employee_code")}
                  >
                    Employee Code
                    {#if approvalsSortColumn === "employee_code" && approvalsSortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if approvalsSortColumn === "employee_code" && approvalsSortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead class="font-bold text-foreground text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="-ml-2.5 h-8 font-bold text-foreground text-xs"
                    onclick={() => handleApprovalsSort("leave_name")}
                  >
                    Leave Type
                    {#if approvalsSortColumn === "leave_name" && approvalsSortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if approvalsSortColumn === "leave_name" && approvalsSortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead
                  class="font-bold text-foreground text-xs text-center"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 font-bold text-foreground text-xs mx-auto"
                    onclick={() => handleApprovalsSort("start_date")}
                  >
                    From Date
                    {#if approvalsSortColumn === "start_date" && approvalsSortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if approvalsSortColumn === "start_date" && approvalsSortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead
                  class="font-bold text-foreground text-xs text-center"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 font-bold text-foreground text-xs mx-auto"
                    onclick={() => handleApprovalsSort("end_date")}
                  >
                    To Date
                    {#if approvalsSortColumn === "end_date" && approvalsSortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if approvalsSortColumn === "end_date" && approvalsSortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead
                  class="font-bold text-foreground text-xs text-center"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 font-bold text-foreground text-xs mx-auto"
                    onclick={() => handleApprovalsSort("total_days")}
                  >
                    Total Days
                    {#if approvalsSortColumn === "total_days" && approvalsSortDirection === "asc"}
                      <ArrowUpIcon class="ml-1.5 size-3" />
                    {:else if approvalsSortColumn === "total_days" && approvalsSortDirection === "desc"}
                      <ArrowDownIcon class="ml-1.5 size-3" />
                    {:else}
                      <ArrowUpDownIcon class="ml-1.5 size-3" />
                    {/if}
                  </Button>
                </TableHead>
                <TableHead class="font-bold text-foreground text-xs"
                  >Reason</TableHead
                >
                <TableHead class="font-bold text-foreground text-xs text-center"
                  >Status</TableHead
                >
                <TableHead
                  class="font-bold text-foreground text-xs text-right pr-4"
                  >Actions</TableHead
                >
              </TableRow>
            </TableHeader>
            <TableBody>
              {#if filteredApprovals.length === 0}
                <TableRow>
                  <TableCell
                    colspan={9}
                    class="py-12 text-center text-muted-foreground text-sm"
                  >
                    {UI_CONSTANTS.EMPTY_STATE_MESSAGE}
                  </TableCell>
                </TableRow>
              {:else}
                {#each paginatedApprovals as app (app.cuid)}
                  <TableRow
                    class="hover:bg-muted/10 transition-colors cursor-pointer"
                    onclick={(e) => handleRowClick(e, app)}
                  >
                    <TableCell class="text-xs font-semibold py-3.5">
                      {app.employee_name}
                    </TableCell>
                    <TableCell class="text-xs font-semibold">
                      {app.employee_code}
                    </TableCell>
                    <TableCell class="text-xs">
                      <div class="font-medium">{app.leave_name}</div>
                      {#if app.leave_code !== "LWP" && app.days_from_lwp > 0}
                        <span
                          class="text-[9px] text-orange-600 bg-orange-50 border border-orange-200 rounded px-1 py-0.5 inline-block mt-0.5"
                        >
                          {#if app.days_from_primary === 0}
                            {app.days_from_lwp} LWP
                          {:else}
                            Split: {app.days_from_primary}
                            {app.leave_code} / {app.days_from_lwp} LWP
                          {/if}
                        </span>
                      {/if}
                      {#if app.leave_code !== "LOP" && app.days_from_lop > 0}
                        <span
                          class="text-[9px] text-red-600 bg-red-50 border border-red-200 rounded px-1 py-0.5 inline-block mt-0.5 font-semibold"
                        >
                          {#if app.days_from_primary === 0}
                            {app.days_from_lop} LOP
                          {:else}
                            Split: {app.days_from_primary}
                            {app.leave_code} / {app.days_from_lop} LOP
                          {/if}
                        </span>
                      {/if}
                    </TableCell>
                    <TableCell class="text-xs text-center">
                      {formatDate(app.start_date)}
                    </TableCell>
                    <TableCell class="text-xs text-center">
                      {formatDate(app.end_date)}
                    </TableCell>
                    <TableCell
                      class="text-xs text-center font-bold tabular-nums"
                    >
                      {app.total_days.toFixed(1)}
                      {#if app.is_half_day}
                        <Badge
                          variant="secondary"
                          class="block w-fit text-[9px] py-0 px-1 mt-0.5 mx-auto bg-accent/60"
                          >Half ({app.half_day_session})</Badge
                        >
                      {/if}
                    </TableCell>
                    <TableCell
                      class="text-xs max-w-xs truncate"
                      title={app.reason || ""}
                    >
                      {app.reason || "-"}
                      {#if app.document_url}
                        <a
                          href={resolve(app.document_url as any)}
                          target="_blank"
                          class="inline-flex items-center ml-2 text-xs text-blue-600 hover:underline"
                        >
                          <FileTextIcon class="size-3 mr-0.5" /> Doc
                        </a>
                      {/if}
                    </TableCell>
                    <TableCell class="text-center">
                      <Badge
                        variant={getStatusBadge(app.request_status)}
                        class="capitalize font-bold text-[10px]"
                      >
                        {#if app.request_status === "pending"}
                          <ClockIcon class="mr-1 size-3" />
                        {:else if app.request_status === "approved"}
                          <CheckCircleIcon class="mr-1 size-3" />
                        {:else if app.request_status === "rejected"}
                          <XCircleIcon class="mr-1 size-3" />
                        {:else}
                          <Trash2Icon class="mr-1 size-3" />
                        {/if}
                        {app.request_status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      class="text-right pr-4"
                      onclick={(e) => e.stopPropagation()}
                    >
                      <TableActions
                        canEdit={false}
                        customActions={approvalActions(app)}
                      />
                    </TableCell>
                  </TableRow>
                {/each}
              {/if}
            </TableBody>
          </Table>
        </Card>
        <Pagination
          bind:currentPage={approvalsCurrentPage}
          pageSize={approvalsPageSize}
          totalItems={filteredApprovals.length}
        />
      </div>
    {/if}
    <!-- End selectedEmployeeUuid else block -->
  {/if}
</div>

<!-- Section 3: CrudModal containing Apply Leave Form (Requirement 3) -->
<CrudModal
  open={isApplyModalOpen}
  title="Apply Leave"
  description="Fill out the details below to submit a leave request."
  {isSubmitting}
  onClose={handleCloseApplyModal}
  cardClass="overflow-visible my-auto"
>
  {#snippet children({ cancel })}
    <form onsubmit={handleApplyLeave} class="space-y-4">
      <!-- Leave Type -->
      <div class="space-y-2 flex flex-col">
        <Label for="leave_type" class="mb-1"
          >Leave Type <span class="text-destructive">*</span></Label
        >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                id="leave_type"
                variant="outline"
                disabled={isSubmitting}
                class="h-9 w-full justify-between border-input bg-transparent px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 transition-[color,box-shadow] outline-none disabled:opacity-50 disabled:cursor-not-allowed {formIsTouched &&
                formValidationErrors.leaveTypeCuid
                  ? 'border-destructive'
                  : ''}"
                {...props}
              >
                <span class="truncate">
                  {leaveTypes.find((t) => t.cuid === formLeaveTypeCuid)
                    ?.leave_name
                    ? `${leaveTypes.find((t) => t.cuid === formLeaveTypeCuid)?.leave_name} (${leaveTypes.find((t) => t.cuid === formLeaveTypeCuid)?.leave_code})`
                    : "Select Leave Type..."}
                </span>
                <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="max-h-56 overflow-y-auto w-(--bits-dropdown-menu-anchor-width)">
            <DropdownMenu.Group>
              <DropdownMenu.Item
                onclick={() => {
                  formLeaveTypeCuid = "";
                }}
                class="cursor-pointer justify-between {!formLeaveTypeCuid
                  ? 'bg-accent font-semibold'
                  : ''}"
              >
                Select Leave Type...
              </DropdownMenu.Item>
              {#each leaveTypes.filter((t) => {
                if (t.leave_code === "LOP") return false;
                if (t.policy && t.policy.gender_specific) {
                  const empGender = (employee?.gender ?? "").toLowerCase();
                  const appGender = (t.policy.applicable_gender ?? "").toLowerCase();
                  if (empGender && appGender && empGender !== appGender) {
                    return false;
                  }
                }
                return true;
              }) as type (type.cuid)}
                <DropdownMenu.Item
                  onclick={() => {
                    formLeaveTypeCuid = type.cuid;
                  }}
                  class="cursor-pointer justify-between {formLeaveTypeCuid ===
                  type.cuid
                    ? 'bg-accent font-semibold'
                    : ''}"
                >
                  {type.leave_name} ({type.leave_code})
                  {#if formLeaveTypeCuid === type.cuid}<CheckIcon
                      class="size-4"
                    />{/if}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {#if formIsTouched && formValidationErrors.leaveTypeCuid}
          <p
            class="text-xs text-[#CC3333] flex items-center gap-1 font-medium mt-1"
          >
            <AlertCircleIcon class="size-3 shrink-0" />
            {formValidationErrors.leaveTypeCuid}
          </p>
        {/if}
      </div>

      <!-- EL Encouragement Advice Tip -->
      {#if selectedLeaveType?.leave_code === "EL"}
        <div
          class="rounded-lg border border-blue-200 bg-blue-50/40 p-3 text-xs text-blue-800"
        >
          💡 <strong>Tip:</strong> Employees are encouraged to utilize at least 6
          Earned Leave (EL) days annually for planned vacations, travel, and rest.
        </div>
      {/if}

      <!-- Maternity Leave Fields -->
      {#if selectedLeaveType?.leave_code === "ML"}
        <div
          class="grid gap-4 grid-cols-2 rounded-lg border border-border/60 bg-muted/10 p-3"
        >
          <div class="space-y-2">
            <Label for="expected_delivery_date"
              >Expected Delivery Date <span class="text-destructive">*</span
              ></Label
            >
            <DatePicker
              id="expected_delivery_date"
              name="expected_delivery_date"
              bind:value={formExpectedDeliveryDate}
              disabled={isSubmitting}
              isError={formIsTouched && !!formValidationErrors.expectedDeliveryDate}
            />
            {#if formIsTouched && formValidationErrors.expectedDeliveryDate}
              <p
                class="text-xs text-[#CC3333] flex items-center gap-1 font-medium mt-1"
              >
                <AlertCircleIcon class="size-3 shrink-0" />
                {formValidationErrors.expectedDeliveryDate}
              </p>
            {/if}
          </div>

          <div class="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              id="is_miscarriage"
              bind:checked={formIsMiscarriage}
              class="size-4 rounded-sm border border-input accent-hrms-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isSubmitting}
            />
            <Label
              for="is_miscarriage"
              class="cursor-pointer font-semibold text-sm"
              >Miscarriage/MTP Case</Label
            >
          </div>
        </div>
      {/if}

      <!-- Paternity Leave Fields -->
      {#if selectedLeaveType?.leave_code === "PL"}
        <div
          class="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3"
        >
          <Label for="child_birth_date"
            >Child's Birth Date <span class="text-destructive">*</span></Label
          >
          <DatePicker
            id="child_birth_date"
            name="child_birth_date"
            bind:value={formChildBirthDate}
            disabled={isSubmitting}
            isError={formIsTouched && !!formValidationErrors.childBirthDate}
          />
          {#if formIsTouched && formValidationErrors.childBirthDate}
            <p
              class="text-xs text-[#CC3333] flex items-center gap-1 font-medium mt-1"
            >
              <AlertCircleIcon class="size-3 shrink-0" />
              {formValidationErrors.childBirthDate}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Start & End Date Grid -->
      <div class="grid gap-4 grid-cols-2">
        <div class="space-y-2">
          <Label for="start_date"
            >Start Date <span class="text-destructive">*</span></Label
          >
          <DatePicker
            id="start_date"
            name="start_date"
            bind:value={formStartDate}
            max={start_date_max || undefined}
            disabled={isSubmitting}
            isError={formIsTouched && !!formValidationErrors.startDate}
            onchange={() => {
              if (
                !formStartDate ||
                (formEndDate && formStartDate > formEndDate)
              ) {
                formEndDate = "";
              }
            }}
          />
          {#if formIsTouched && formValidationErrors.startDate}
            <p
              class="text-xs text-[#CC3333] flex items-center gap-1 font-medium mt-1"
            >
              <AlertCircleIcon class="size-3 shrink-0" />
              {formValidationErrors.startDate}
            </p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="end_date"
            >End Date <span class="text-destructive">*</span></Label
          >
          <DatePicker
            id="end_date"
            name="end_date"
            bind:value={formEndDate}
            min={formStartDate || undefined}
            max={end_date_max || undefined}
            disabled={isSubmitting || formIsHalfDay || !formStartDate}
            isError={formIsTouched && !!formValidationErrors.endDate}
          />
          {#if formIsTouched && formValidationErrors.endDate}
            <p
              class="text-xs text-[#CC3333] flex items-center gap-1 font-medium mt-1"
            >
              <AlertCircleIcon class="size-3 shrink-0" />
              {formValidationErrors.endDate}
            </p>
          {/if}
        </div>
      </div>

      <!-- Half Day Section -->
      {#if selectedLeaveType?.policy?.allow_half_day}
        <div
          class="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 p-3"
        >
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="half_day"
              bind:checked={formIsHalfDay}
              class="size-4 rounded-sm border border-input accent-hrms-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isSubmitting}
            />
            <Label for="half_day" class="cursor-pointer font-semibold text-sm"
              >Apply for Half Day</Label
            >
          </div>

          {#if formIsHalfDay}
            <div class="grid gap-2 pl-6">
              <Label for="half_day_session"
                >Half Day Session <span class="text-destructive">*</span></Label
              >
              <div class="flex gap-4">
                <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="half_day_session"
                    value="FN"
                    bind:group={formHalfDaySession}
                    class="accent-hrms-primary"
                    disabled={isSubmitting}
                  />
                  Forenoon (FN)
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="half_day_session"
                    value="AN"
                    bind:group={formHalfDaySession}
                    class="accent-hrms-primary"
                    disabled={isSubmitting}
                  />
                  Afternoon (AN)
                </label>
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Reason -->
      <div class="space-y-2">
        <Label for="reason"
          >Reason <span class="text-destructive">*</span></Label
        >
        <textarea
          id="reason"
          bind:value={formReason}
          placeholder="Provide details about your leave..."
          class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
        ></textarea>
        {#if formIsTouched && formValidationErrors.reason}
          <p
            class="text-xs text-[#CC3333] flex items-center gap-1 font-medium mt-1"
          >
            <AlertCircleIcon class="size-3 shrink-0" />
            {formValidationErrors.reason}
          </p>
        {/if}
      </div>

      <!-- Document Upload -->
      <div class="space-y-2">
        <Label for="document">
          Supporting Document
          {#if isDocRequired}
            <span class="text-destructive">* (Required)</span>
          {:else}
            <span class="text-muted-foreground text-xs">(Optional)</span>
          {/if}
        </Label>
        <div
          class="relative flex items-center justify-center rounded-md border border-dashed border-input bg-muted/10 px-4 py-3 hover:bg-muted/20 transition-colors"
        >
          <input
            type="file"
            id="document"
            accept="image/*,application/pdf"
            onchange={handleFileChange}
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isSubmitting}
          />
          <div
            class="flex flex-col items-center gap-1 text-center pointer-events-none"
          >
            <UploadIcon class="size-5 text-muted-foreground" />
            <span class="text-xs text-muted-foreground">
              {formFileName || "Click or drag image/PDF up to 2MB"}
            </span>
          </div>
        </div>
        {#if formIsTouched && formValidationErrors.document}
          <p
            class="text-xs text-[#CC3333] flex items-center gap-1 font-medium mt-1"
          >
            <AlertCircleIcon class="size-3 shrink-0" />
            {formValidationErrors.document}
          </p>
        {/if}
      </div>

      <!-- Leave Impact Preview Section (Requirement 5) -->
      {#if formLeaveTypeCuid && formStartDate && leaveImpactBreakdown && leaveImpactBreakdown.totalActive > 0}
        {@const remaining = getAvailableBalanceForMonth(
          formLeaveTypeCuid,
          selectedLeaveType?.leave_code || "",
          formStartDate,
        )}
        {@const isExceeded =
          selectedLeaveType?.leave_code !== "LWP" &&
          leaveImpactBreakdown.totalActive > remaining}
        {@const splitType =
          selectedLeaveType?.leave_code === "LWP"
            ? "Leave Without Pay (LWP)"
            : "Loss of Pay (LOP)"}

        <div
          class="rounded-lg border border-border bg-accent/20 p-3.5 space-y-2.5"
        >
          <p
            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Leave Impact Preview
          </p>
          {#if isExceeded}
            <div
              class="text-xs text-hrms-primary font-semibold space-y-1.5 border-b border-border/50 pb-2 mb-1"
            >
              <p class="flex items-start gap-1.5">
                <AlertCircleIcon class="size-4 shrink-0 text-hrms-primary" />
                <span
                  >You have {remaining.toFixed(1)} available leave days. This request
                  exceeds your balance by {leaveImpactBreakdown.lopDays.toFixed(
                    1,
                  )} day(s) and will result in {splitType} for the excess days.</span
                >
              </p>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="text-muted-foreground">
                Requested Duration (incl. sandwiched days):
              </div>
              <div class="font-bold text-right">
                {leaveImpactBreakdown.totalActive.toFixed(1)} days
              </div>

              <div class="text-muted-foreground">
                Deducted from {selectedLeaveType?.leave_code}:
              </div>
              <div class="font-semibold text-right">
                {leaveImpactBreakdown.primaryDays.toFixed(1)} days
              </div>

              <div class="text-muted-foreground">{splitType}:</div>
              <div class="font-bold text-right text-red-600">
                {leaveImpactBreakdown.lopDays.toFixed(1)} days
              </div>

              {#if leaveImpactBreakdown.cyclesBreakdown.length > 0}
                <div
                  class="col-span-2 border-t border-border/50 mt-1.5 pt-1.5 space-y-1"
                >
                  <p
                    class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Estimated LOP Payroll Cycle Assignment:
                  </p>
                  {#each leaveImpactBreakdown.cyclesBreakdown as { cycle, days }}
                    <div class="flex justify-between text-xs font-semibold">
                      <span class="text-muted-foreground">{cycle}:</span>
                      <span class="text-red-600">{days.toFixed(1)} day(s)</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="text-muted-foreground">
                {selectedLeaveType?.leave_code === "LWP" ? 'Requested Duration (incl. sandwiched days):' : 'Requested Duration (Working Days):'}
              </div>
              <div class="font-bold text-right">
                {leaveImpactBreakdown.totalActive.toFixed(1)} days
              </div>

              {#if selectedLeaveType?.leave_code !== "LWP"}
                <div class="text-muted-foreground">
                  Deducted from {selectedLeaveType?.leave_code}:
                </div>
                <div class="font-semibold text-right">
                  {leaveImpactBreakdown.primaryDays.toFixed(1)} days
                </div>
              {/if}

              {#if selectedLeaveType?.leave_code === "LWP"}
                <div class="text-muted-foreground">Deducted from LWP:</div>
                <div class="font-bold text-right text-amber-700">
                  {leaveImpactBreakdown.lwpDays.toFixed(1)} days
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <div
        class="flex items-center justify-end gap-3 pt-4 border-t border-border/50"
      >
        <Button
          type="button"
          variant="outline"
          onclick={cancel}
          disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button
        >
        <Button
          type="submit"
          class="bg-hrms-primary text-white hover:bg-hrms-primary/90 font-bold"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <LoaderCircleIcon class="mr-2 size-4 animate-spin" />
            Applying...
          {:else}
            Apply
          {/if}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>

<!-- Apply Leave Unsaved Changes Modal -->
<ConfirmModal
  open={showApplyUnsavedModal}
  title="Cancel Changes"
  description="Are you sure you want to cancel? All unsaved changes will be lost."
  cancelLabel="Keep Editing"
  confirmLabel="Cancel"
  onCancel={() => {
    showApplyUnsavedModal = false;
  }}
  onConfirm={() => {
    showApplyUnsavedModal = false;
    closeApplyModal();
  }}
/>


<!-- View Details Modal for Approvals -->
<CrudModal
  open={isDetailsModalOpen}
  title="Leave Request Details"
  description="Review the leave request submitted by the employee."
  isSubmitting={isActionSubmitting}
  onClose={() => {
    isDetailsModalOpen = false;
    selectedApproval = null;
  }}
>
  {#if selectedApproval}
    <div class="space-y-5 py-2">
      <!-- Employee Details -->
      <div class="space-y-3">
        <p
          class="text-xs text-muted-foreground uppercase font-bold tracking-wider border-b border-border pb-1"
        >
          Employee Information
        </p>
        <div class="grid grid-cols-2 gap-2.5 text-sm">
          <div class="font-bold text-foreground">Name:</div>
          <div class="text-muted-foreground text-right">
            {selectedApproval.employee_name}
          </div>
          <div class="font-bold text-foreground">Code:</div>
          <div class="text-muted-foreground text-right">
            {selectedApproval.employee_code}
          </div>
        </div>
      </div>

      <!-- Leave Request details -->
      <div class="space-y-3">
        <p
          class="text-xs text-muted-foreground uppercase font-bold tracking-wider border-b border-border pb-1"
        >
          Request Information
        </p>
        <div class="grid grid-cols-2 gap-2.5 text-sm">
          <div class="font-bold text-foreground">Leave Type:</div>
          <div class="text-muted-foreground text-right">
            {selectedApproval.leave_name} ({selectedApproval.leave_code})
          </div>

          <div class="font-bold text-foreground">From Date:</div>
          <div class="text-muted-foreground text-right">
            {formatDate(selectedApproval.start_date)}
          </div>

          <div class="font-bold text-foreground">To Date:</div>
          <div class="text-muted-foreground text-right">
            {formatDate(selectedApproval.end_date)}
          </div>

          <div class="font-bold text-foreground">Total Days:</div>
          <div class="text-muted-foreground text-right">
            {selectedApproval.total_days.toFixed(1)} days
            {#if selectedApproval.is_half_day}
              <Badge
                variant="secondary"
                class="ml-1 text-[9px] py-0 px-1 bg-accent/60 font-semibold"
                >Half ({selectedApproval.half_day_session})</Badge
              >
            {/if}
          </div>

          {#if selectedApproval.leave_code !== "LWP" && selectedApproval.days_from_lwp > 0}
            <div class="font-bold text-foreground">Deduction Breakdown:</div>
            <div class="text-muted-foreground text-right text-xs">
              {#if selectedApproval.days_from_primary === 0}
                {selectedApproval.days_from_lwp} LWP
              {:else}
                {selectedApproval.days_from_primary}
                {selectedApproval.leave_code} | {selectedApproval.days_from_lwp}
                LWP
              {/if}
            </div>
          {/if}

          {#if selectedApproval.leave_code !== "LOP" && selectedApproval.days_from_lop > 0}
            <div class="font-bold text-foreground">Deduction Breakdown:</div>
            <div class="text-muted-foreground text-right text-xs">
              {#if selectedApproval.days_from_primary === 0}
                {selectedApproval.days_from_lop} LOP
              {:else}
                {selectedApproval.days_from_primary}
                {selectedApproval.leave_code} | {selectedApproval.days_from_lop}
                LOP
              {/if}
            </div>
          {/if}

          <div class="font-bold text-foreground">Applied Date:</div>
          <div class="text-muted-foreground text-right">
            {formatDate(selectedApproval.created_at)}
          </div>

          <div class="font-bold text-foreground">Status:</div>
          <div class="text-right">
            <Badge
              variant={getStatusBadge(selectedApproval.request_status)}
              class="capitalize font-bold text-[10px]"
            >
              {selectedApproval.request_status}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Reason -->
      <div class="space-y-1.5">
        <p
          class="text-xs text-muted-foreground uppercase font-bold tracking-wider"
        >
          Reason
        </p>
        <div
          class="rounded-md bg-muted/10 p-3 border border-border text-sm text-foreground wrap-break-word leading-relaxed min-h-[50px]"
        >
          {selectedApproval.reason || "No reason provided"}
        </div>
      </div>

      <!-- Supporting Document -->
      {#if selectedApproval.document_url}
        <div
          class="flex items-center justify-between border-t border-border pt-3"
        >
          <span class="text-sm font-bold text-foreground">Supporting Document</span>
          <a
            href={resolve(selectedApproval.document_url as any)}
            target="_blank"
            class="inline-flex items-center text-xs font-bold text-blue-600 hover:underline border border-blue-200 rounded px-2.5 py-1 bg-blue-50/30"
          >
            <FileTextIcon class="size-3.5 mr-1" /> View Document
          </a>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div
        class="flex items-center justify-end gap-3 pt-4 border-t border-border/50"
      >
        {#if selectedApproval.request_status === "pending"}
          {#if selectedApproval.source === "my_leaves"}
            <Button
              type="button"
              variant="destructive"
              class="font-bold"
              onclick={() => {
                openWithdrawModal(selectedApproval);
              }}
              disabled={isActionSubmitting}
            >
              Withdraw
            </Button>
          {:else if selectedApproval.source === "approvals"}
            <Button
              type="button"
              class="bg-red-600 text-white hover:bg-red-700 font-bold focus-visible:ring-red-500/50 focus-visible:border-red-600"
              onclick={() => openRejectConfirm(selectedApproval)}
              disabled={isActionSubmitting}
            >
              Reject
            </Button>
            <Button
              type="button"
              class="bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
              onclick={() => openApproveConfirm(selectedApproval)}
              disabled={isActionSubmitting}
            >
              Approve
            </Button>
          {/if}
        {:else}
          <span class="text-xs text-muted-foreground italic">Status: {selectedApproval.request_status}</span>
        {/if}
      </div>
    </div>
  {/if}
</CrudModal>

<!-- Confirm Approve Modal -->
<ConfirmModal
  open={approveModalOpen}
  title="Approve Leave Request"
  description="Are you sure you want to approve this leave request?"
  confirmLabel="Approve"
  isSubmitting={isActionSubmitting}
  onCancel={() => {
    approveModalOpen = false;
    approvalToAct = null;
  }}
  onConfirm={executeApprove}
/>

<!-- Confirm Reject Modal -->
<ConfirmModal
  open={rejectModalOpen}
  title="Reject Leave Request"
  description="Are you sure you want to reject this leave request?"
  confirmLabel="Reject"
  isSubmitting={isActionSubmitting}
  onCancel={() => {
    rejectModalOpen = false;
    approvalToAct = null;
  }}
  onConfirm={executeReject}
/>

<!-- Confirm Withdraw Modal -->
<ConfirmModal
  open={withdrawModalOpen}
  title="Withdraw Leave Request"
  description="Are you sure you want to withdraw this leave request?"
  confirmLabel="Withdraw"
  isSubmitting={isWithdrawing}
  onCancel={() => {
    withdrawModalOpen = false;
    requestToWithdraw = null;
  }}
  onConfirm={confirmWithdraw}
/>
