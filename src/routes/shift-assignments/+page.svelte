<script lang="ts">
  import { onMount } from "svelte";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
  import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import CalendarCogIcon from "@lucide/svelte/icons/calendar-cog";
  import PlusIcon from "@lucide/svelte/icons/plus";

  import { toast } from "$lib/toast";
  import { createDirtyChecker } from "$lib/utils";
  import { globalIsDirty } from "$lib/stores/navigationGuard";
  import { UI_CONSTANTS } from "$lib/constants";

  import {
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    Input,
    Label,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    CrudModal,
    TableActions,
    FilterDropdown,
    StatusDropdown,
    Pagination,
    SearchInput,
    SearchableDropdown,
    DatePicker,
  } from "$lib/components";
  import ConfirmModal from "$lib/components/common/ConfirmModal.svelte";

  import type { ShiftAssignment } from "$lib/types/shift-assignment";
  import {
    fetchShiftAssignments,
    createShiftAssignment,
    updateShiftAssignment,
    deleteShiftAssignment,
  } from "$lib/api/shift-assignments";
  import { ApiError } from "$lib/api/local";

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let assignmentsList = $derived<ShiftAssignment[]>(data.assignments);
  let isLoading = $state(false);
  let loadError = $state("");

  let searchQuery = $state("");
  let statusFilter = $state<"all" | boolean>("all");
  let sortColumn = $state("effective_from");
  let sortDirection = $state<"asc" | "desc" | null>("desc");

  let currentPage = $state(1);
  let pageSize = $state(10);

  // Shared Form State
  let editingAssignment = $state<ShiftAssignment | null>(null);
  let formEmployeeCuid = $state("");
  let formShiftCuid = $state("");
  let formEffectiveFrom = $state("");
  let formEffectiveTo = $state("");
  let formStatus = $state<boolean>(true);
  let isSubmitting = $state(false);
  let isModalOpen = $state(false);
  let showConfirmClose = $state(false);

  // Touch States
  let isEmployeeTouched = $state(false);
  let isShiftTouched = $state(false);
  let isEffectiveFromTouched = $state(false);
  let isEffectiveToTouched = $state(false);

  // Validation Errors
  let backendError = $state("");
  let employeeError = $derived(
    isEmployeeTouched && !formEmployeeCuid
      ? "Employee selection is required"
      : "",
  );
  let shiftError = $derived(
    isShiftTouched && !formShiftCuid ? "Shift selection is required" : "",
  );

  function formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  let effectiveFromError = $derived.by(() => {
    if (!isEffectiveFromTouched) return "";
    if (!formEffectiveFrom) return "Effective from date is required";
    
    if (formEmployeeCuid) {
      const empOpt = data.employeeOptions.find((e: any) => e.id === formEmployeeCuid);
      if (empOpt) {
        if (empOpt.joiningDate && formEffectiveFrom < empOpt.joiningDate) {
          return `Effective from date cannot be before employee's joining date (${formatDateForDisplay(empOpt.joiningDate)})`;
        }
        if (empOpt.relievingDate && formEffectiveFrom > empOpt.relievingDate) {
          return `Effective from date cannot be after employee's relieving date (${formatDateForDisplay(empOpt.relievingDate)})`;
        }
      }
    }
    return "";
  });

  let effectiveToError = $derived.by(() => {
    if (!isEffectiveToTouched) return "";
    if (!formEffectiveTo) return "Effective to date is required";
    if (formEffectiveFrom && formEffectiveTo < formEffectiveFrom) {
      return "Effective to date must be greater than or equal to Effective from date";
    }
    
    if (formEmployeeCuid) {
      const empOpt = data.employeeOptions.find((e: any) => e.id === formEmployeeCuid);
      if (empOpt) {
        if (empOpt.joiningDate && formEffectiveTo < empOpt.joiningDate) {
          return `Effective to date cannot be before employee's joining date (${formatDateForDisplay(empOpt.joiningDate)})`;
        }
        if (empOpt.relievingDate && formEffectiveTo > empOpt.relievingDate) {
          return `Effective to date cannot be after employee's relieving date (${formatDateForDisplay(empOpt.relievingDate)})`;
        }
      }
    }
    return "";
  });

  let backendEmployeeError = $derived.by(() => {
    if (!backendError) return "";
    const err = backendError.toLowerCase();
    if (
      err.includes("already exists") ||
      err.includes("overlap") ||
      err.includes("specified period")
    ) {
      return "";
    }
    if (err.includes("employee") || err.includes("subordinate")) {
      return backendError;
    }
    return "";
  });

  let backendShiftError = $derived.by(() => {
    if (!backendError) return "";
    const err = backendError.toLowerCase();
    if (
      err.includes("already exists") ||
      err.includes("overlap") ||
      err.includes("specified period") ||
      err.includes("shift")
    ) {
      return backendError;
    }
    if (
      !err.includes("employee") &&
      !err.includes("subordinate") &&
      !err.includes("date") &&
      !err.includes("from") &&
      !err.includes("to")
    ) {
      return backendError;
    }
    return "";
  });

  let backendEffectiveFromError = $derived.by(() => {
    if (!backendError) return "";
    const err = backendError.toLowerCase();
    if (
      err.includes("effective_from") ||
      (err.includes("from") && err.includes("date") && !err.includes("to"))
    ) {
      return backendError;
    }
    return "";
  });

  let backendEffectiveToError = $derived.by(() => {
    if (!backendError) return "";
    const err = backendError.toLowerCase();
    if (
      err.includes("effective_to") ||
      err.includes("greater than") ||
      (err.includes("to") && err.includes("date"))
    ) {
      return backendError;
    }
    return "";
  });

  const dirtyChecker = createDirtyChecker<{
    employee_cuid: string;
    shift_cuid: string;
    effective_from: string;
    effective_to: string;
    status: boolean;
  }>();

  let isDirty = $derived(
    isModalOpen &&
      dirtyChecker.isDirty({
        employee_cuid: formEmployeeCuid,
        shift_cuid: formShiftCuid,
        effective_from: formEffectiveFrom,
        effective_to: formEffectiveTo,
        status: formStatus,
      }),
  );

  function handleClose() {
    if (isDirty) {
      showConfirmClose = true;
    } else {
      isModalOpen = false;
      $globalIsDirty = false;
    }
  }

  let filteredAssignments = $derived.by(() => {
    let result = [...assignmentsList];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((assignment) => {
        const empName =
          `${assignment.employee?.first_name} ${assignment.employee?.last_name}`.toLowerCase();
        const empCode = (assignment.employee?.emp_code ?? "").toLowerCase();
        const shiftName = (assignment.shift?.name ?? "").toLowerCase();
        return (
          empName.includes(query) ||
          empCode.includes(query) ||
          shiftName.includes(query)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (assignment) => assignment.status === statusFilter,
      );
    }

    if (sortDirection && sortColumn) {
      result.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortColumn === "employee") {
          valA = `${a.employee?.first_name} ${a.employee?.last_name}`;
          valB = `${b.employee?.first_name} ${b.employee?.last_name}`;
        } else if (sortColumn === "shift") {
          valA = a.shift?.name ?? "";
          valB = b.shift?.name ?? "";
        } else {
          valA = a[sortColumn as keyof typeof a];
          valB = b[sortColumn as keyof typeof b];
        }

        if (valA === null || valA === undefined)
          return sortDirection === "asc" ? 1 : -1;
        if (valB === null || valB === undefined)
          return sortDirection === "asc" ? -1 : 1;

        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (typeof valA === "boolean" && typeof valB === "boolean") {
          const numA = valA ? 1 : 0;
          const numB = valB ? 1 : 0;
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }
        return 0;
      });
    }

    return result;
  });

  let totalCount = $derived(assignmentsList.length);
  let paginatedAssignments = $derived(
    filteredAssignments.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );
  let activeCount = $derived(
    assignmentsList.filter((a) => a.status === true).length,
  );
  let inactiveCount = $derived(
    assignmentsList.filter((a) => a.status === false).length,
  );

  async function loadAssignments() {
    isLoading = true;
    loadError = "";
    try {
      assignmentsList = await fetchShiftAssignments();
    } catch (err) {
      loadError =
        err instanceof ApiError
          ? err.message
          : "Failed to load shift assignments.";
      toast.error(loadError);
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

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

  function openCreateModal() {
    editingAssignment = null;
    formEmployeeCuid = "";
    formShiftCuid = "";
    formEffectiveFrom = "";
    formEffectiveTo = "";
    formStatus = true;

    isEmployeeTouched = false;
    isShiftTouched = false;
    isEffectiveFromTouched = false;
    isEffectiveToTouched = false;
    backendError = "";

    dirtyChecker.snapshot({
      employee_cuid: "",
      shift_cuid: "",
      effective_from: "",
      effective_to: "",
      status: true,
    });
    isModalOpen = true;
  }

  function openEditModal(assignment: ShiftAssignment) {
    editingAssignment = assignment;
    formEmployeeCuid = assignment.employee_cuid;
    formShiftCuid = assignment.shift_cuid;
    formEffectiveFrom = String(assignment.effective_from);
    formEffectiveTo = String(assignment.effective_to);
    formStatus = assignment.status;

    isEmployeeTouched = false;
    isShiftTouched = false;
    isEffectiveFromTouched = false;
    isEffectiveToTouched = false;
    backendError = "";

    dirtyChecker.snapshot({
      employee_cuid: assignment.employee_cuid,
      shift_cuid: assignment.shift_cuid,
      effective_from: String(assignment.effective_from),
      effective_to: String(assignment.effective_to),
      status: assignment.status,
    });
    isModalOpen = true;
  }

  async function handleSaveAssignment(e: Event) {
    e.preventDefault();
    if (editingAssignment && !isDirty) return;

    isEmployeeTouched = true;
    isShiftTouched = true;
    isEffectiveFromTouched = true;
    isEffectiveToTouched = true;

    if (employeeError || shiftError || effectiveFromError || effectiveToError) {
      return;
    }

    isSubmitting = true;
    backendError = "";

    try {
      if (editingAssignment) {
        await updateShiftAssignment(editingAssignment.cuid, {
          employee_cuid: formEmployeeCuid,
          shift_cuid: formShiftCuid,
          effective_from: formEffectiveFrom,
          effective_to: formEffectiveTo,
          status: formStatus,
        });
        toast.success("Shift assignment updated successfully");
      } else {
        await createShiftAssignment({
          employee_cuid: formEmployeeCuid,
          shift_cuid: formShiftCuid,
          effective_from: formEffectiveFrom,
          effective_to: formEffectiveTo,
          status: formStatus,
        });
        toast.success("Shift assignment created successfully");
      }
      await loadAssignments();
      isModalOpen = false;
    } catch (err) {
      const errMsg =
        err instanceof ApiError ? err.message : "Something went wrong.";
      backendError = errMsg;
      if (
        !(
          err instanceof ApiError &&
          (err.status === 400 || err.status === 409 || err.status === 403)
        )
      ) {
        toast.error(errMsg);
      }
      console.error(err);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Shift Assignments</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
  <div
    class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"
  >
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">
        Shift Assignments
      </h1>
    </div>
    <Button
      type="button"
      class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
      onclick={openCreateModal}
    >
      Assign Shift
    </Button>
  </div>

  <!-- Metrics Cards -->
  <div class="grid gap-4 sm:grid-cols-2">
    <Card>
      <CardHeader class="pb-2">
        <CardDescription>Total Assignments</CardDescription>
        <CardTitle class="text-4xl font-bold text-[#262626] tabular-nums"
          >{totalCount}</CardTitle
        >
      </CardHeader>
    </Card>
    <Card>
      <CardHeader class="pb-2">
        <CardDescription>Active Assignments</CardDescription>
        <CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums"
          >{activeCount}</CardTitle
        >
      </CardHeader>
    </Card>
  </div>

  <div class="space-y-3">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        id="search_assignments"
        name="search_assignments"
        bind:value={searchQuery}
        oninput={() => (currentPage = 1)}
        placeholder="Search by employee name, code, or shift name..."
      />
      <FilterDropdown
        value={statusFilter}
        onChange={(value) => {
          statusFilter = value;
          currentPage = 1;
        }}
      />
    </div>

    <Card class="py-0">
      <Table>
        <TableHeader class="bg-muted">
          <TableRow>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button
                variant="ghost"
                size="sm"
                class="-ml-2.5 h-8 font-bold text-foreground text-[15px]"
                onclick={() => handleSort("employee")}
              >
                Employee
                {#if sortColumn === "employee" && sortDirection === "asc"}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === "employee" && sortDirection === "desc"}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button
                variant="ghost"
                size="sm"
                class="-ml-2.5 h-8 font-bold text-foreground text-[15px]"
                onclick={() => handleSort("shift")}
              >
                Shift
                {#if sortColumn === "shift" && sortDirection === "asc"}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === "shift" && sortDirection === "desc"}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead
              class="text-center font-bold text-foreground text-[15px]"
            >
              <Button
                variant="ghost"
                size="sm"
                class="h-8 font-bold text-foreground text-[15px]"
                onclick={() => handleSort("effective_from")}
              >
                Effective From
                {#if sortColumn === "effective_from" && sortDirection === "asc"}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === "effective_from" && sortDirection === "desc"}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead
              class="text-center font-bold text-foreground text-[15px]"
            >
              <Button
                variant="ghost"
                size="sm"
                class="h-8 font-bold text-foreground text-[15px]"
                onclick={() => handleSort("effective_to")}
              >
                Effective To
                {#if sortColumn === "effective_to" && sortDirection === "asc"}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === "effective_to" && sortDirection === "desc"}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead
              class="text-center font-bold text-foreground text-[15px]"
            >
              <Button
                variant="ghost"
                size="sm"
                class="h-8 font-bold text-foreground text-[15px]"
                onclick={() => handleSort("status")}
              >
                Status
                {#if sortColumn === "status" && sortDirection === "asc"}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === "status" && sortDirection === "desc"}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead
              class="text-right font-bold text-foreground text-[15px] whitespace-nowrap"
              >Actions</TableHead
            >
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if isLoading}
            <TableRow>
              <TableCell
                colspan={6}
                class="py-8 text-center text-muted-foreground"
              >
                <LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
                Loading assignments...
              </TableCell>
            </TableRow>
          {:else if filteredAssignments.length === 0}
            <TableRow>
              <TableCell
                colspan={6}
                class="py-8 text-center text-muted-foreground"
              >
                {UI_CONSTANTS.EMPTY_STATE_MESSAGE}
              </TableCell>
            </TableRow>
          {:else}
            {#each paginatedAssignments as assignment (assignment.cuid)}
              <TableRow
                onclick={(e) => {
                  if (
                    (e.target as HTMLElement).closest("button") ||
                    (e.target as HTMLElement).closest("a")
                  )
                    return;
                  openEditModal(assignment);
                }}
                class="cursor-pointer"
              >
                <TableCell>
                  <div class="flex flex-col">
                    <span class="font-semibold"
                      >{assignment.employee?.first_name}
                      {assignment.employee?.last_name}</span
                    >
                    <span class="text-xs text-muted-foreground"
                      >{assignment.employee?.emp_code}</span
                    >
                  </div>
                </TableCell>
                <TableCell>
                  <span class="font-semibold">{assignment.shift?.name}</span>
                </TableCell>
                <TableCell class="text-center"
                  >{assignment.effective_from}</TableCell
                >
                <TableCell class="text-center"
                  >{assignment.effective_to}</TableCell
                >
                <TableCell class="text-center">
                  <Badge
                    variant={assignment.status === true
                      ? "default"
                      : "secondary"}
                  >
                    {assignment.status ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <TableActions
                    canEdit={true}
                    onEdit={() => openEditModal(assignment)}
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
      totalItems={filteredAssignments.length}
    />
  </div>
</div>

<CrudModal
  open={isModalOpen}
  title={editingAssignment
      ? "Edit Shift Assignment"
      : "Assign Shift"}
  {isSubmitting}
  onClose={handleClose}
>
  {#snippet children({ cancel })}
    <form class="space-y-4" onsubmit={handleSaveAssignment}>
      <!-- Employee Dropdown -->
      <div class="space-y-2">
        <SearchableDropdown
          label="Employee *"
          options={data.employeeOptions}
          value={formEmployeeCuid}
          placeholder="Select employee..."
          onSelect={(val) => {
            formEmployeeCuid = String(val);
            isEmployeeTouched = true;
            if (formEffectiveFrom) isEffectiveFromTouched = true;
            if (formEffectiveTo) isEffectiveToTouched = true;
            backendError = "";
          }}
        />
        {#if employeeError}
          <p
            class="text-xs"
            style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
          >
            {employeeError}
          </p>
        {:else if backendEmployeeError}
          <p
            class="text-xs"
            style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
          >
            {backendEmployeeError}
          </p>
        {/if}
      </div>

      <!-- Shift Dropdown -->
      <div class="space-y-2">
        <SearchableDropdown
          label="Shift *"
          options={data.shiftOptions}
          value={formShiftCuid}
          placeholder="Select shift..."
          onSelect={(val) => {
            formShiftCuid = String(val);
            isShiftTouched = true;
            backendError = "";
          }}
        />
        {#if shiftError}
          <p
            class="text-xs"
            style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
          >
            {shiftError}
          </p>
        {:else if backendShiftError}
          <p
            class="text-xs"
            style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
          >
            {backendShiftError}
          </p>
        {/if}
      </div>

      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="effective_from"
            >Effective From <span class="text-destructive">*</span></Label
          >
          <DatePicker
            id="effective_from"
            name="effective_from"
            bind:value={formEffectiveFrom}
            isError={isEffectiveFromTouched && (!!effectiveFromError || !!backendEffectiveFromError)}
            onchange={() => {
              isEffectiveFromTouched = true;
              backendError = "";
            }}
          />
          {#if effectiveFromError}
            <p
              class="text-xs"
              style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
            >
              {effectiveFromError}
            </p>
          {:else if backendEffectiveFromError}
            <p
              class="text-xs"
              style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
            >
              {backendEffectiveFromError}
            </p>
          {/if}
        </div>
        <div class="space-y-2">
          <Label for="effective_to"
            >Effective To <span class="text-destructive">*</span></Label
          >
          <DatePicker
            id="effective_to"
            name="effective_to"
            bind:value={formEffectiveTo}
            isError={isEffectiveToTouched && (!!effectiveToError || !!backendEffectiveToError)}
            onchange={() => {
              isEffectiveToTouched = true;
              backendError = "";
            }}
          />
          {#if effectiveToError}
            <p
              class="text-xs"
              style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
            >
              {effectiveToError}
            </p>
          {:else if backendEffectiveToError}
            <p
              class="text-xs"
              style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}"
            >
              {backendEffectiveToError}
            </p>
          {/if}
        </div>
      </div>

      <!-- Status Toggle -->
      {#if editingAssignment}
        <div class="space-y-2">
          <Label for="assignment_status"></Label>
          <StatusDropdown
            id="assignment_status"
            name="assignment_status"
            value={formStatus}
            onChange={(val) => {
              formStatus = val;
              backendError = "";
            }}
          />
        </div>
      {/if}

      <!-- Submit & Close Buttons -->
      <div
        class="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6"
      >
        <Button
          type="button"
          variant="outline"
          onclick={cancel}
          disabled={isSubmitting}>{UI_CONSTANTS.BUTTON_CANCEL}</Button
        >
        <Button
          type="submit"
          class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
          disabled={isSubmitting || (!!editingAssignment && !isDirty)}
        >
          {isSubmitting
            ? UI_CONSTANTS.BUTTON_SAVING
            : editingAssignment
              ? UI_CONSTANTS.BUTTON_UPDATE
              : UI_CONSTANTS.BUTTON_SAVE}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>

<ConfirmModal
  open={showConfirmClose}
  title="Cancel Changes"
  description="Are you sure you want to cancel? All unsaved changes will be lost."
  confirmLabel="Cancel"
  cancelLabel="Keep Editing"
  onConfirm={() => {
    showConfirmClose = false;
    isModalOpen = false;
    $globalIsDirty = false;
  }}
  onCancel={() => {
    showConfirmClose = false;
  }}
/>
