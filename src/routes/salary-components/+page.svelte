<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import CheckIcon from "@lucide/svelte/icons/check";
  import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Label,
    TableRow,
    TableCell,
    SearchBar,
    Pagination,
    MasterTable,
    MasterFormModal,
    ConfirmDialog,
  } from "$lib/components";

  import type {
    SalaryComponent,
    SalaryComponentType,
  } from "$lib/types/salary-component";
  import { validateComponentName } from "$lib/validators/salary-component";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { toast } from "$lib/toast.svelte";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import { scale } from "svelte/transition";

  /** Full dataset returned from the API for the current filter combination */
  let allItems = $state<SalaryComponent[]>([]);

  let page = $state(1);
  let pageSize = $state(10);

  /** Slice of allItems for the current page — derived client-side */
  let filteredItems = $derived(
    allItems
      .filter((c) => filterType === "all" || c.component_type === filterType)
      .filter((c) => filterActive === "all" || c.is_active === (filterActive === "true"))
  );

  let pagedItems = $derived(
    filteredItems.slice((page - 1) * pageSize, page * pageSize)
  );

  let totalItems = $derived(filteredItems.length);
  let totalPages = $derived(Math.max(1, Math.ceil(filteredItems.length / pageSize)));

  /** Stats derived from the unfiltered full list (re-fetched on each loadComponents call) */
  let earningsCount = $derived(
    allItems.filter((c) => c.component_type === "earning" && c.is_active).length
  );
  let deductionsCount = $derived(
    allItems.filter((c) => c.component_type === "deduction" && c.is_active).length
  );
  let totalAllComponents = $derived(allItems.length);

  let isLoading = $state(false);

  let searchQuery = $state("");
  let filterType = $state<"all" | SalaryComponentType>("all");
  // 'all' | 'true' | 'false' maps to undefined | true | false for the API
  let filterActive = $state<"all" | "true" | "false">("all");


  let sortBy = $state("component_name");
  let sortOrder = $state<"asc" | "desc">("asc");

  let isModalOpen = $state(false);
  let isSubmitting = $state(false);

  let editingId = $state<string | null>(null);

  let formName = $state("");
  let formType = $state<SalaryComponentType>("earning");
  let formIsTaxable = $state(false);
  let formIsActive = $state(true);

  // Snapshot captured when the modal opens — used for dirty detection
  let formInitialName = $state("");
  let formInitialType = $state<SalaryComponentType>("earning");
  let formInitialIsTaxable = $state(false);
  let formInitialIsActive = $state(true);

  /** True when any field differs from its value at modal open time */
  let isDirty = $derived(
    formName !== formInitialName ||
    formType !== formInitialType ||
    formIsTaxable !== formInitialIsTaxable ||
    formIsActive !== formInitialIsActive
  );

  /** Controls the "unsaved changes" confirmation dialog */
  let showDiscardConfirm = $state(false);


  const headers = [
    {
      key: "component_name",
      label: "Component Name",
      sortable: true,
      class: "pl-5",
    },
    {
      key: "component_type",
      label: "Type",
      sortable: true,
    },
    {
      key: "is_taxable",
      label: "Taxable",
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
    },
    {
      key: "actions",
      label: "Actions",
      class: "text-center",
    },
  ];

  async function loadComponents() {
    try {
      isLoading = true;

      const params = new SvelteURLSearchParams();

      if (searchQuery) params.set("search", searchQuery);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/salary-components?${params}`);

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(
          errorJson.message || "Failed loading salary components",
        );
      }

      const json = await res.json();
      allItems = json.data;
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed loading salary components",
      );
    } finally {
      isLoading = false;
    }
  }

  // API effect: fires only when search or sort changes
  let previousApiFilters = "";
  $effect(() => {
    const apiFilters = `${searchQuery}-${sortBy}-${sortOrder}`;
    if (previousApiFilters && previousApiFilters !== apiFilters) {
      page = 1;
    }
    previousApiFilters = apiFilters;
    loadComponents();
  });

  // Page-reset effect: fires on client-side filter changes (no API call)
  let clientFiltersInitialized = false;
  $effect(() => {
    void filterType;
    void filterActive;
    if (clientFiltersInitialized) {
      page = 1;
    }
    clientFiltersInitialized = true;
  });

  function handleOpenCreate() {
    editingId = null;

    formName = "";
    formType = "earning";
    formIsActive = true;
    formIsTaxable = false;

    // Capture snapshot for dirty detection
    formInitialName = "";
    formInitialType = "earning";
    formInitialIsActive = true;
    formInitialIsTaxable = false;

    isModalOpen = true;
  }

  function handleOpenEdit(component: SalaryComponent) {
    editingId = component.cuid;

    formName = component.component_name;
    formType = component.component_type;
    formIsActive = component.is_active;
    formIsTaxable = component.is_taxable;

    // Capture snapshot for dirty detection
    formInitialName = component.component_name;
    formInitialType = component.component_type;
    formInitialIsActive = component.is_active;
    formInitialIsTaxable = component.is_taxable;

    isModalOpen = true;
  }

  /** Called for ALL close attempts — gates on dirty state. */
  function handleRequestClose() {
    if (isDirty) {
      showDiscardConfirm = true;
    } else {
      isModalOpen = false;
    }
  }

  /** User confirmed discard — close and reset form to clean defaults. */
  function handleDiscardConfirm() {
    showDiscardConfirm = false;
    isModalOpen = false;
    formName = "";
    formType = "earning";
    formIsActive = true;
    formIsTaxable = false;
  }

  /** User chose Continue Editing — keep modal open, dismiss confirm dialog. */
  function handleDiscardCancel() {
    showDiscardConfirm = false;
  }

  async function handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();

    const trimmedName = formName.trim();
    formName = trimmedName;

    const nameError = validateComponentName(trimmedName);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    try {
      isSubmitting = true;

      const payload = {
        component_name: trimmedName,
        component_type: formType,
        is_active: formIsActive,
        is_taxable: formIsTaxable,
      };

      const res = await fetch(
        editingId
          ? `/api/salary-components?salaryComponentCuid=${editingId}`
          : "/api/salary-components",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json();

      if (!res.ok)
        throw new Error(json.message || "Failed to save salary component");

      await loadComponents();

      toast.success(
        editingId
          ? "Salary Component updated successfully"
          : "Salary Component created successfully",
      );
      isModalOpen = false;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save salary component",
      );
    } finally {
      isSubmitting = false;
    }
  }

  let activeDropdown = $state<string | null>(null);
  /** cuid of the row whose kebab menu is currently open; null = none */
  let openKebabCuid = $state<string | null>(null);
  /** The trigger element for the currently open kebab — used to track live position on scroll */
  let kebabTriggerEl = $state<HTMLElement | null>(null);
  /** Live-computed position derived from the trigger element's bounding rect */
  let kebabPos = $state<{ top: number; left: number } | null>(null);

  /** Recomputes kebabPos from the current bounding rect of the trigger element */
  function updateKebabPos() {
    if (!kebabTriggerEl) return;
    const rect = kebabTriggerEl.getBoundingClientRect();
    kebabPos = { top: rect.bottom + 4, left: rect.left + rect.width / 2 };
  }

  /** Re-anchor on scroll while a kebab is open */
  $effect(() => {
    if (!kebabTriggerEl) return;
    updateKebabPos();
    window.addEventListener('scroll', updateKebabPos, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', updateKebabPos, { capture: true });
    };
  });

  function toggleDropdown(name: string, e: MouseEvent) {
    e.stopPropagation();
    if (activeDropdown === name) {
      activeDropdown = null;
    } else {
      activeDropdown = name;
    }
  }

  function closeAllDropdowns() {
    activeDropdown = null;
    openKebabCuid = null;
    kebabTriggerEl = null;
    kebabPos = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      activeDropdown = null;
      openKebabCuid = null;
      kebabTriggerEl = null;
      kebabPos = null;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} onclick={closeAllDropdowns} />

<svelte:head>
  <title>Salary Components | PieQ HRMS</title>
</svelte:head>

<div class="space-y-5">
  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Salary Components</h1>
      <p class="mt-2 text-muted-foreground">
        Define and manage salary earning and deduction configurations.
      </p>
    </div>
    <Button
      onclick={handleOpenCreate}
      class="gap-2 bg-hrms-primary text-white hover:bg-hrms-primary-dark border-0"
    >
      <PlusIcon class="size-4" />
      Create Component
    </Button>
  </div>

  <!-- Stats Grid -->
  <div class="grid gap-6 md:grid-cols-3">
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground"
          >Total Components</CardTitle
        >
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold text-black dark:text-white">{totalAllComponents}</p>
        <p class="mt-1 text-xs text-muted-foreground">
          Registered salary masters
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground"
          >Active Earnings</CardTitle
        >
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold text-hrms-primary">{earningsCount}</p>
        <p class="mt-1 text-xs text-muted-foreground">
          Additions to gross base salary
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground"
          >Active Deductions</CardTitle
        >
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold text-hrms-destructive">{deductionsCount}</p>
        <p class="mt-1 text-xs text-muted-foreground">
          Statutory and optional cutbacks
        </p>
      </CardContent>
    </Card>
  </div>

  <!-- Filter + Table Card -->
  <Card class="pt-1 gap-2">
    <!-- Toolbar -->
    <div
      class="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="w-full max-w-xs">
        <SearchBar
          bind:value={searchQuery}
          placeholder="Search component name..."
        />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <!-- Filter Type Dropdown -->
        <div class="relative">
          <button
            type="button"
            onclick={(e) => toggleDropdown("filterType", e)}
            class="relative h-9 w-40 rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-[color,box-shadow] text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
          >
            <span>
              {filterType === "all"
                ? "All Types"
                : filterType === "earning"
                  ? "Earning"
                  : "Deduction"}
            </span>
            <span
              class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70"
            >
              <ChevronDownIcon class="size-4" />
            </span>
          </button>

          {#if activeDropdown === "filterType"}
            <div
              transition:scale={{ start: 0.95, duration: 100 }}
              class="absolute left-0 mt-1.5 z-50 w-full min-w-40 rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
            >
              {#each [{ value: "all", label: "All Types" }, { value: "earning", label: "Earning" }, { value: "deduction", label: "Deduction" }] as opt (opt.value)}
                <button
                  type="button"
                  onclick={() => {
                    filterType = opt.value as "all" | SalaryComponentType;
                    activeDropdown = null;
                  }}
                  class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300
									{filterType === opt.value ? 'bg-slate-100 dark:bg-slate-800' : ''}"
                >
                  <span>{opt.label}</span>
                  {#if filterType === opt.value}
                    <CheckIcon class="size-3.5 shrink-0" />
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Filter Active Dropdown -->
        <div class="relative">
          <button
            type="button"
            onclick={(e) => toggleDropdown("filterActive", e)}
            class="relative h-9 w-40 rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-[color,box-shadow] text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
          >
            <span>
              {filterActive === "all"
                ? "All Statuses"
                : filterActive === "true"
                  ? "Active"
                  : "Inactive"}
            </span>
            <span
              class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70"
            >
              <ChevronDownIcon class="size-4" />
            </span>
          </button>

          {#if activeDropdown === "filterActive"}
            <div
              transition:scale={{ start: 0.95, duration: 100 }}
              class="absolute left-0 mt-1.5 z-50 w-full min-w-40 rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
            >
              {#each [{ value: "all", label: "All Statuses" }, { value: "true", label: "Active" }, { value: "false", label: "Inactive" }] as opt (opt.value)}
                <button
                  type="button"
                  onclick={() => {
                    filterActive = opt.value as "all" | "true" | "false";
                    activeDropdown = null;
                  }}
                  class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300
									{filterActive === opt.value ? 'bg-slate-100 dark:bg-slate-800' : ''}"
                >
                  <span>{opt.label}</span>
                  {#if filterActive === opt.value}
                    <CheckIcon class="size-3.5 shrink-0" />
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Table -->
    <MasterTable
      {headers}
      items={pagedItems}
      {isLoading}
      bind:sortBy
      bind:sortOrder
      emptyMessage="No salary components found matching your selection."
    >
      {#snippet itemSnippet(comp: SalaryComponent)}
        <TableRow class="hover:bg-muted/50 transition-colors">
          <TableCell class="font-medium pl-5">{comp.component_name}</TableCell>
          <TableCell>
            <span class="capitalize">{comp.component_type}</span>
          </TableCell>
          <TableCell>
            <span>{comp.is_taxable ? "Taxable" : "Non-taxable"}</span>
          </TableCell>
          <TableCell>
            <span
              class="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium w-15
							{comp.is_active ? 'bg-foreground text-background' : 'bg-muted text-foreground'}"
            >
              {comp.is_active ? "Active" : "Inactive"}
            </span>
          </TableCell>
          <TableCell class="text-center">
            <div class="relative flex justify-center">
              <!-- Kebab trigger -->
              <Button
                variant="ghost"
                size="icon-sm"
                class="h-8 w-8 text-muted-foreground hover:text-foreground mx-auto"
                onclick={(e) => {
                  e.stopPropagation();
                  if (openKebabCuid === comp.cuid) {
                    openKebabCuid = null;
                    kebabTriggerEl = null;
                    kebabPos = null;
                  } else {
                    kebabTriggerEl = e.currentTarget as HTMLElement;
                    openKebabCuid = comp.cuid;
                  }
                }}
                aria-label="Row actions"
                title="Actions"
              >
                <MoreVerticalIcon class="size-4" />
              </Button>

            </div>
          </TableCell>
        </TableRow>
      {/snippet}
    </MasterTable>

    <!-- Pagination -->
    {#if totalItems > 0}
      <div class="border-t p-3">
        <Pagination bind:page {totalPages} total={totalItems} {pageSize} />
      </div>
    {/if}
  </Card>
</div>

<!-- Kebab action menu — position:fixed escapes table overflow clipping without needing a portal -->
{#if openKebabCuid !== null && kebabPos !== null}
  {@const activeCuid = openKebabCuid}
  {@const pos = kebabPos}
  {@const activeComp = pagedItems.find((c) => c.cuid === activeCuid)}
  {#if activeComp}
    <div
      role="menu"
      tabindex="-1"
      transition:scale={{ start: 0.95, duration: 100 }}
      style="position:fixed; top:{pos.top}px; left:{pos.left}px; transform:translateX(-50%); z-index:9999;"
      class="w-28 rounded-lg border border-border bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onclick={() => {
          const comp = activeComp;
          openKebabCuid = null;
          kebabTriggerEl = null;
          kebabPos = null;
          handleOpenEdit(comp);
        }}
        class="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <PencilIcon class="size-3.5" />
        Edit
      </button>
    </div>
  {/if}
{/if}

<!-- Create / Edit Modal -->
<MasterFormModal
  isOpen={isModalOpen}
  title={editingId ? "Edit Salary Component" : "Create Salary Component"}
  {isSubmitting}
  canSave={isDirty}
  onclose={handleRequestClose}
  onsubmit={handleFormSubmit}
>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label for="component_name">Component Name</Label>
      <Input
        id="component_name"
        type="text"
        bind:value={formName}
        placeholder="e.g. Basic Pay, HRA, Provident Fund"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- Component Type Custom Dropdown -->
      <div class="space-y-2 relative">
        <Label for="component_type">Component Type</Label>
        <button
          id="component_type"
          type="button"
          onclick={(e) => toggleDropdown("formType", e)}
          class="relative h-9 w-full rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-[color,box-shadow] text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
        >
          <span>{formType === "earning" ? "Earning" : "Deduction"}</span>
          <span
            class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70"
          >
            <ChevronDownIcon class="size-4" />
          </span>
        </button>

        {#if activeDropdown === "formType"}
          <div
            transition:scale={{ start: 0.95, duration: 100 }}
            class="absolute left-0 top-17 z-50 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
          >
            {#each [{ value: "earning", label: "Earning" }, { value: "deduction", label: "Deduction" }] as opt (opt.value)}
              <button
                type="button"
                onclick={() => {
                  formType = opt.value as SalaryComponentType;
                  activeDropdown = null;
                }}
                class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300
									{formType === opt.value ? 'bg-slate-100 dark:bg-slate-800' : ''}"
              >
                <span>{opt.label}</span>
                {#if formType === opt.value}
                  <CheckIcon class="size-3.5 shrink-0" />
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Status Custom Dropdown -->
      <div class="space-y-2 relative">
        <Label for="is_active">Status</Label>
        <button
          id="is_active"
          type="button"
          onclick={(e) => toggleDropdown("formIsActive", e)}
          class="relative h-9 w-full rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs transition-all duration-200 text-left flex items-center justify-between select-none cursor-pointer dark:bg-input/30"
        >
          <span>{formIsActive ? "Active" : "Inactive"}</span>
          <span
            class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70"
          >
            <ChevronDownIcon class="size-4" />
          </span>
        </button>

        {#if activeDropdown === "formIsActive"}
          <div
            transition:scale={{ start: 0.95, duration: 100 }}
            class="absolute left-0 top-17 z-50 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md p-1 shadow-lg flex flex-col gap-0.5"
          >
            {#each [{ value: true, label: "Active" }, { value: false, label: "Inactive" }] as opt (opt.value)}
              <button
                type="button"
                onclick={() => {
                  formIsActive = opt.value;
                  activeDropdown = null;
                }}
                class="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300
									{formIsActive === opt.value ? 'bg-slate-100 dark:bg-slate-800' : ''}"
              >
                <span>{opt.label}</span>
                {#if formIsActive === opt.value}
                  <CheckIcon class="size-3.5 shrink-0" />
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Taxable toggle -->
    <div
      class="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3"
    >
      <input
        id="is_taxable"
        type="checkbox"
        bind:checked={formIsTaxable}
        class="size-4 rounded border-input accent-hrms-primary cursor-pointer"
      />
      <div class="space-y-0.5">
        <Label for="is_taxable" class="cursor-pointer font-medium"
          >Taxable Component</Label
        >
        <p class="text-xs text-muted-foreground">
          Indicates if income tax applies to this component
        </p>
      </div>
    </div>
  </div>
</MasterFormModal>

<!-- Unsaved Changes Confirmation -->
<ConfirmDialog
  isOpen={showDiscardConfirm}
  title="Discard unsaved changes?"
  message="You have unsaved changes. Are you sure you want to discard them?"
  confirmText="Discard Changes"
  cancelText="Continue Editing"
  onconfirm={handleDiscardConfirm}
  oncancel={handleDiscardCancel}
/>
