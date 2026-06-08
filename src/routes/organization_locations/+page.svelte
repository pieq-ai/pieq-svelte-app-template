<script lang="ts">
  import { onMount } from "svelte";
  import type { CompanyLocation } from "$lib/types/organization_location";
  import {
    fetchAllLocations,
    fetchCountries,
    fetchStates,
    createLocation,
    updateLocation,
    deleteLocation,
    activateLocation as activateLocationApi,
    createCountry,
    createState,
  } from "$lib/api/locations";
  import { ApiError } from "$lib/api/local";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
  import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import CheckIcon from "@lucide/svelte/icons/check";
  import { toast } from "$lib/toast";
  import { confirmation } from "$lib/confirmation.svelte.js";
  import { createDirtyChecker } from "$lib/utils";
  import { UI_CONSTANTS } from "$lib/constants";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
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
    SearchInput
  } from "$lib/components";

  let locations = $state<CompanyLocation[]>([]);
  let page = $state(1);
  let limit = $state(10);
  let loading = $state(false);
  let searchQuery = $state("");

  // Modal state
  let showForm = $state(false);

  let editLocation = $state<CompanyLocation | null>(null);
  let formName = $state("");
  let formAddress1 = $state("");
  let formAddress2 = $state("");
  let formCity = $state("");
  let formStateCuid = $state("");
  let formCountryCuid = $state("");
  let formPinCode = $state("");
  let formTimezone = $state("");
  let formStatus = $state(true);
  let formError = $state("");
  let formLoading = $state(false);

  const dirtyChecker = createDirtyChecker<{
    location_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state_cuid: string;
    country_cuid: string;
    pin_code: string;
    timezone: string;
    status: boolean;
  }>();

  let isDirty = $derived(
    showForm &&
    dirtyChecker.isDirty({
      location_name: formName.trim(),
      address_line1: formAddress1.trim(),
      address_line2: formAddress2.trim(),
      city: formCity.trim(),
      state_cuid: formStateCuid,
      country_cuid: formCountryCuid,
      pin_code: formPinCode.trim(),
      timezone: formTimezone.trim(),
      status: formStatus
    })
  );

  // Create enablement: enabled once required fields contain any value
  let isCreateEnabled = $derived(
    formName.trim() !== "" &&
      formAddress1.trim() !== "" &&
      formCity.trim() !== "" &&
      formCountryCuid !== "" &&
      formStateCuid !== "" &&
      formPinCode.trim() !== "" &&
      formTimezone.trim() !== ""
  );

  // Dropdown choices
  let countries = $state<any[]>([]);
  let states = $state<any[]>([]);

  let filteredStates = $derived(
    states.filter((s) => s.country_cuid === formCountryCuid)
  );

  async function fetchDropdowns() {
    try {
      countries = await fetchCountries();
      states = await fetchStates();
    } catch (e) {
      console.error("Failed to fetch dropdown choices", e);
      toast.error(
        e instanceof ApiError
          ? e.message
          : "Failed to load countries or states"
      );
    }
  }

  function getCountryName(countryCuid: string): string {
    const country = countries.find((c) => c.cuid === countryCuid);
    return country ? country.country_name : countryCuid;
  }

  function getStateName(stateCuid: string): string {
    const state = states.find((s) => s.cuid === stateCuid);
    return state ? state.state_name : stateCuid;
  }

  // Filter
  let filterStatus = $state<"all" | boolean>("all");
  let filterCountry = $state<string>("all");
  let filterState = $state<string>("all");

  let selectedCountryLabel = $derived(
    filterCountry === "all"
      ? "All Countries"
      : countries.find((c) => c.cuid === filterCountry)?.country_name ||
          "All Countries"
  );

  let selectedStateLabel = $derived(
    filterState === "all"
      ? "All States"
      : states.find((s) => s.cuid === filterState)?.state_name || "All States"
  );

  function handleCountrySelect(val: string) {
    filterCountry = val;
  }

  function handleStateSelect(val: string) {
    filterState = val;
  }

  $effect(() => {
    if (filterCountry !== "all") {
      const activeStates = states.filter(
        (s) => s.country_cuid === filterCountry
      );
      if (
        filterState !== "all" &&
        !activeStates.some((s) => s.cuid === filterState)
      ) {
        filterState = "all";
      }
    }
  });

  // Sorting states
  let sortColumn = $state<string | null>(null);
  let sortDirection = $state<"asc" | "desc" | null>(null);

  function toggleSort(col: string) {
    if (sortColumn === col) {
      if (sortDirection === "asc") {
        sortDirection = "desc";
      } else if (sortDirection === "desc") {
        sortColumn = null;
        sortDirection = null;
      } else {
        sortDirection = "asc";
      }
    } else {
      sortColumn = col;
      sortDirection = "asc";
    }
  }

  let filteredLocations = $derived.by(() => {
    let list = locations;
    if (filterStatus !== "all") {
      list = locations.filter((loc) => loc.is_active === filterStatus);
    }

    if (filterCountry !== "all") {
      list = list.filter((loc) => loc.country_cuid === filterCountry);
    }
    if (filterState !== "all") {
      list = list.filter((loc) => loc.state_cuid === filterState);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((loc) => {
        const locName = (loc.location_name ?? "").toLowerCase();
        const city = (loc.city ?? "").toLowerCase();
        const stateName = getStateName(loc.state_cuid ?? "").toLowerCase();
        const countryName = getCountryName(
          loc.country_cuid ?? ""
        ).toLowerCase();
        const pinCode = (loc.pin_code ?? "").toLowerCase();

        return (
          locName.includes(query) ||
          city.includes(query) ||
          stateName.includes(query) ||
          countryName.includes(query) ||
          pinCode.includes(query)
        );
      });
    }
    return list;
  });

  let sortedLocations = $derived.by(() => {
    let list = [...filteredLocations];
    if (sortColumn && sortDirection) {
      list.sort((a, b) => {
        let valA = a[sortColumn as keyof typeof a];
        let valB = b[sortColumn as keyof typeof b];

        if (typeof valA === "string" && typeof valB === "string") {
          const comp = valA.localeCompare(valB);
          return sortDirection === "asc" ? comp : -comp;
        }
        if (typeof valA === "boolean" && typeof valB === "boolean") {
          const numA = valA ? 1 : 0;
          const numB = valB ? 1 : 0;
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }
        if (valA === null || valA === undefined)
          return sortDirection === "asc" ? 1 : -1;
        if (valB === null || valB === undefined)
          return sortDirection === "asc" ? -1 : 1;
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  });

  let paginatedLocations = $derived(
    sortedLocations.slice((page - 1) * limit, page * limit)
  );

  let totalLocations = $derived(locations.length);
  let activeLocationsCount = $derived(
    locations.filter((loc) => loc.is_active).length
  );
  let inactiveLocationsCount = $derived(
    locations.filter((loc) => !loc.is_active).length
  );

  $effect(() => {
    if (page > totalPages) {
      page = totalPages;
    }
    if (page < 1) {
      page = 1;
    }
  });

  let total = $derived(filteredLocations.length);
  let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));

  async function fetchLocations() {
    loading = true;
    try {
      locations = await fetchAllLocations();
    } catch (e) {
      console.error("Failed to fetch locations", e);
      toast.error(
        e instanceof ApiError ? e.message : "Failed to load locations"
      );
    } finally {
      loading = false;
    }
  }

  function openCreate() {
    editLocation = null;
    formName = "";
    formAddress1 = "";
    formAddress2 = "";
    formCity = "";
    formCountryCuid = "";
    formStateCuid = "";
    formPinCode = "";
    formTimezone = "UTC";
    formStatus = true;
    formError = "";
    dirtyChecker.snapshot({
      location_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_cuid: "",
      country_cuid: "",
      pin_code: "",
      timezone: "UTC",
      status: true
    });
    showForm = true;
  }

  function openEdit(loc: CompanyLocation) {
    editLocation = loc;
    formName = loc.location_name;
    formAddress1 = loc.address_line1 ?? "";
    formAddress2 = loc.address_line2 ?? "";
    formCity = loc.city ?? "";
    formCountryCuid = loc.country_cuid ?? "";
    formStateCuid = loc.state_cuid ?? "";
    formPinCode = loc.pin_code ?? "";
    formTimezone = loc.timezone ?? "UTC";
    formStatus = loc.is_active;
    formError = "";
    dirtyChecker.snapshot({
      location_name: loc.location_name,
      address_line1: loc.address_line1 ?? "",
      address_line2: loc.address_line2 ?? "",
      city: loc.city ?? "",
      state_cuid: loc.state_cuid ?? "",
      country_cuid: loc.country_cuid ?? "",
      pin_code: loc.pin_code ?? "",
      timezone: loc.timezone ?? "UTC",
      status: loc.is_active
    });
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    formName = "";
    formAddress1 = "";
    formAddress2 = "";
    formCity = "";
    formCountryCuid = "";
    formStateCuid = "";
    formPinCode = "";
    formTimezone = "";
    formError = "";
    editLocation = null;
  }

  function attemptCloseForm() {
    closeForm();
  }

  async function submitForm(e: Event) {
    e.preventDefault();
    const nameTrimmed = formName.trim();
    if (!nameTrimmed) {
      formError = "Company Location name is required.";
      return;
    }
    if (nameTrimmed.length < 2) {
      formError = "Company Location name must be at least 2 characters.";
      return;
    }
    if (nameTrimmed.length > 255) {
      formError =
        "Company Location name exceeds maximum length of 255 characters.";
      return;
    }

    const address1Trimmed = formAddress1.trim();
    const cityTrimmed = formCity.trim();
    const pinTrimmed = formPinCode.trim();
    const tzTrimmed = formTimezone.trim();

    if (!address1Trimmed) {
      formError = "Address Line 1 is required.";
      return;
    }
    if (!cityTrimmed) {
      formError = "City is required.";
      return;
    }
    if (!formCountryCuid) {
      formError = "Country is required.";
      return;
    }
    if (!formStateCuid) {
      formError = "State is required.";
      return;
    }
    if (!pinTrimmed) {
      formError = "Pin Code is required.";
      return;
    }
    if (!tzTrimmed) {
      formError = "Timezone is required.";
      return;
    }

    const lower = nameTrimmed.toLowerCase();
    if (
      lower.includes("<script") ||
      lower.includes("script>") ||
      lower.includes("drop table") ||
      lower.includes("select ") ||
      lower.includes("--") ||
      lower.includes("/*")
    ) {
      formError = "Company Location name contains potential security threat.";
      return;
    }

    if (/^\d+$/.test(nameTrimmed)) {
      formError = "Company Location name cannot contain only numbers.";
      return;
    }

    if (!/[A-Za-z]/.test(nameTrimmed)) {
      formError = "Company Location name must contain at least one alphabet.";
      return;
    }

    if (/[A-Za-z]\d|\d[A-Za-z]/.test(nameTrimmed)) {
      formError = "Company Location name cannot contain numbers.";
      return;
    }

    formLoading = true;
    formError = "";
    try {
      const payload: any = {
        location_name: nameTrimmed,
        address_line1: address1Trimmed,
        address_line2: formAddress2 ? formAddress2.trim() : null,
        city: cityTrimmed,
        state_cuid: formStateCuid,
        country_cuid: formCountryCuid,
        pin_code: pinTrimmed,
        timezone: tzTrimmed,
      };
      if (editLocation) {
        payload.is_active = formStatus;
        await updateLocation(editLocation.cuid, payload);
      } else {
        await createLocation(payload);
      }
      const isEdit = !!editLocation;
      closeForm();
      await fetchLocations();
      toast.success(
        isEdit
          ? "Company Location updated successfully"
          : "Company Location created successfully"
      );
    } catch (e) {
      formError = e instanceof ApiError ? e.message : "Something went wrong.";
      toast.error(formError);
    } finally {
      formLoading = false;
    }
  }

  async function deactivateLocation(cuid: string) {
    confirmation.ask({
      title: "Deactivate Location",
      message:
        "Deactivate this location? It will remain visible but marked as inactive.",
      confirmText: "Deactivate",
      cancelText: "Cancel",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteLocation(cuid);
          await fetchLocations();
          toast.success("Company Location deactivated successfully");
        } catch (e) {
          toast.error(
            e instanceof ApiError ? e.message : "Failed to deactivate location"
          );
        }
      },
    });
  }

  async function activateLocation(cuid: string) {
    confirmation.ask({
      title: "Activate Location",
      message: "Activate this location? It will be marked as active.",
      confirmText: "Activate",
      cancelText: "Cancel",
      isDestructive: false,
      onConfirm: async () => {
        try {
          await activateLocationApi(cuid);
          await fetchLocations();
          toast.success("Company Location activated successfully");
        } catch (e) {
          toast.error(
            e instanceof ApiError ? e.message : "Failed to activate location"
          );
        }
      },
    });
  }

  // Add Country / State Modal states
  let showAddCountry = $state(false);
  let showAddState = $state(false);
  let newCountryName = $state("");
  let newStateName = $state("");
  let addCountryError = $state("");
  let addStateError = $state("");
  let addCountryLoading = $state(false);
  let addStateLoading = $state(false);

  function openAddCountryModal() {
    newCountryName = "";
    addCountryError = "";
    showAddCountry = true;
  }

  function openAddStateModal() {
    if (!formCountryCuid) {
      toast.error("Please select a country first");
      return;
    }
    newStateName = "";
    addStateError = "";
    showAddState = true;
  }

  async function handleAddCountrySubmit(e: Event) {
    e.preventDefault();
    const nameTrimmed = newCountryName.trim();
    if (!nameTrimmed) {
      addCountryError = "Country name is required.";
      return;
    }
    if (nameTrimmed.length < 2) {
      addCountryError = "Country name must be at least 2 characters.";
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(nameTrimmed)) {
      addCountryError = "Country name can contain only letters and spaces.";
      return;
    }
    if (nameTrimmed.length > 255) {
      addCountryError = "Country name exceeds maximum length of 255 characters.";
      return;
    }

    addCountryLoading = true;
    addCountryError = "";
    try {
      const result = await createCountry(nameTrimmed);
      await fetchDropdowns();
      formCountryCuid = result.cuid;
      formStateCuid = "";
      showAddCountry = false;
      newCountryName = "";
      toast.success("Country created successfully");
    } catch (e) {
      addCountryError = e instanceof ApiError ? e.message : "Failed to create country.";
      toast.error(addCountryError);
    } finally {
      addCountryLoading = false;
    }
  }

  async function handleAddStateSubmit(e: Event) {
    e.preventDefault();
    const nameTrimmed = newStateName.trim();
    if (!nameTrimmed) {
      addStateError = "State name is required.";
      return;
    }
    if (nameTrimmed.length < 2) {
      addStateError = "State name must be at least 2 characters.";
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(nameTrimmed)) {
      addStateError = "State name can contain only letters and spaces.";
      return;
    }
    if (nameTrimmed.length > 255) {
      addStateError = "State name exceeds maximum length of 255 characters.";
      return;
    }
    if (!formCountryCuid) {
      addStateError = "Please select a country first.";
      return;
    }

    addStateLoading = true;
    addStateError = "";
    try {
      const result = await createState(nameTrimmed, formCountryCuid);
      await fetchDropdowns();
      formStateCuid = result.cuid;
      showAddState = false;
      newStateName = "";
      toast.success("State created successfully");
    } catch (e) {
      addStateError = e instanceof ApiError ? e.message : "Failed to create state.";
      toast.error(addStateError);
    } finally {
      addStateLoading = false;
    }
  }

  onMount(async () => {
    await fetchLocations();
    await fetchDropdowns();
  });
</script>

<svelte:head>
  <title>Locations</title>
</svelte:head>

<div class="w-full space-y-6 px-1 py-0">
  <div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight sm:text-4xl wrap-break-word">Locations</h1>
    </div>
    <Button
      type="button"
      class="bg-[#F45310] text-white hover:bg-[#F45310]/90"
      onclick={openCreate}
    >
      <PlusIcon class="size-4" />
      Add Location
    </Button>
  </div>

  <!-- Metrics Cards -->
  <div class="grid gap-4 sm:grid-cols-3">
    <Card>
      <CardHeader class="pb-2">
        <CardDescription>Total Locations</CardDescription>
        <CardTitle class="text-4xl font-bold text-[#262626] tabular-nums">{totalLocations}</CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader class="pb-2">
        <CardDescription>Active Locations</CardDescription>
        <CardTitle class="text-4xl font-bold text-[#F45310] tabular-nums">{activeLocationsCount}</CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader class="pb-2">
        <CardDescription>Inactive Locations</CardDescription>
        <CardTitle class="text-4xl font-bold text-[#800020] tabular-nums">{inactiveLocationsCount}</CardTitle>
      </CardHeader>
    </Card>
  </div>

  <div class="space-y-3">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput id="search_locations" name="search_locations" bind:value={searchQuery} oninput={() => (page = 1)} placeholder="Search by location, city, pin..." />
      <FilterDropdown value={filterStatus} onChange={(value) => { filterStatus = value; page = 1; }} />

      <!-- Country Filter using DropdownMenu -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button variant="outline" class="h-9 w-[180px] justify-between border-input bg-background shadow-xs hover:bg-accent outline-none" {...props}>
              <span class="truncate">{selectedCountryLabel}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="ml-2 size-4 opacity-50 shrink-0"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-[180px] max-h-56 overflow-y-auto">
          <DropdownMenu.Group>
            <DropdownMenu.Item onclick={() => handleCountrySelect('all')} class="justify-between cursor-pointer {filterCountry === 'all' ? 'bg-accent font-semibold' : ''}">
              All Countries
            </DropdownMenu.Item>
            {#each countries as c}
              <DropdownMenu.Item onclick={() => handleCountrySelect(c.cuid)} class="justify-between cursor-pointer {filterCountry === c.cuid ? 'bg-accent font-semibold' : ''}">
                {c.country_name}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- State Filter using DropdownMenu -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button variant="outline" class="h-9 w-[180px] justify-between border-input bg-background shadow-xs hover:bg-accent outline-none" {...props}>
              <span class="truncate">{selectedStateLabel}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="ml-2 size-4 opacity-50 shrink-0"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-[180px] max-h-56 overflow-y-auto">
          <DropdownMenu.Group>
            <DropdownMenu.Item onclick={() => handleStateSelect('all')} class="justify-between cursor-pointer {filterState === 'all' ? 'bg-accent font-semibold' : ''}">
              All States
            </DropdownMenu.Item>
            {#each filterCountry === 'all' ? states : states.filter((s) => s.country_cuid === filterCountry) as s}
              <DropdownMenu.Item onclick={() => handleStateSelect(s.cuid)} class="justify-between cursor-pointer {filterState === s.cuid ? 'bg-accent font-semibold' : ''}">
                {s.state_name}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>

    <Card class="py-0">
      <Table>
        <TableHeader class="bg-muted">
          <TableRow>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('location_name')}>
                Location Name
                {#if sortColumn === 'location_name' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'location_name' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('address_line1')}>
                Address
                {#if sortColumn === 'address_line1' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'address_line1' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('city')}>
                City
                {#if sortColumn === 'city' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'city' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('state_cuid')}>
                State
                {#if sortColumn === 'state_cuid' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'state_cuid' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('country_cuid')}>
                Country
                {#if sortColumn === 'country_cuid' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'country_cuid' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('pin_code')}>
                Pin Code
                {#if sortColumn === 'pin_code' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'pin_code' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="font-bold text-foreground text-[15px]">
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('timezone')}>
                Timezone
                {#if sortColumn === 'timezone' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'timezone' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">
              <Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('is_active')}>
                Status
                {#if sortColumn === 'is_active' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'is_active' && sortDirection === 'desc'}
                  <ArrowDownIcon class="ml-2 size-4" />
                {:else}
                  <ArrowUpDownIcon class="ml-2 size-4" />
                {/if}
              </Button>
            </TableHead>
            <TableHead class="text-right font-bold text-foreground text-[15px] whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if loading}
            <TableRow>
              <TableCell colspan={9} class="py-8 text-center text-muted-foreground">
                <LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
                Loading locations...
              </TableCell>
            </TableRow>
          {:else if filteredLocations.length === 0}
            <TableRow>
              <TableCell colspan={9} class="py-8 text-center text-muted-foreground">
                {UI_CONSTANTS.EMPTY_STATE_MESSAGE}
              </TableCell>
            </TableRow>
          {:else}
            {#each paginatedLocations as loc (loc.cuid)}
              <TableRow 
                onclick={(e) => {
                  if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                  openEdit(loc);
                }} 
                class="cursor-pointer"
              >
                <TableCell>
                  <span class="font-semibold">{loc.location_name}</span>
                </TableCell>
                <TableCell>
                  {loc.address_line1}{loc.address_line2 ? ", " + loc.address_line2 : ""}
                </TableCell>
                <TableCell>{loc.city}</TableCell>
                <TableCell>{getStateName(loc.state_cuid)}</TableCell>
                <TableCell>{getCountryName(loc.country_cuid)}</TableCell>
                <TableCell>{loc.pin_code}</TableCell>
                <TableCell>{loc.timezone}</TableCell>
                <TableCell class="text-center">
                  <Badge variant={loc.is_active === true ? 'default' : 'secondary'}>{loc.is_active ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell class="text-right">
                  <TableActions
                    canEdit={true}
                    onEdit={() => openEdit(loc)}
                  />
                </TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </Card>
    <Pagination bind:currentPage={page} pageSize={limit} totalItems={filteredLocations.length} />
  </div>
</div>

<CrudModal
  open={showForm}
  title={editLocation ? 'Edit Location' : 'Create Location'}
  isDirty={isDirty}
  isSubmitting={formLoading}
  onClose={attemptCloseForm}
>
  {#snippet children({ cancel })}
    <form class="space-y-4" onsubmit={submitForm}>
      <div class="space-y-2">
        <Label for="location_name">Location Name <span class="text-destructive">*</span></Label>
        <Input
          id="location_name"
          name="location_name"
          bind:value={formName}
          class={formError ? 'border-destructive' : ''}
          placeholder="e.g. Chennai - HQ"
          oninput={() => { formError = ''; }}
        />
        {#if formError}
          <p class="text-xs text-destructive">{formError}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="location_address1">Address Line 1 <span class="text-destructive">*</span></Label>
        <Input
          id="location_address1"
          name="location_address1"
          bind:value={formAddress1}
          placeholder="e.g. 123 Enterprise Way"
        />
      </div>

      <div class="space-y-2">
        <Label for="location_address2">Address Line 2 (Optional)</Label>
        <Input
          id="location_address2"
          name="location_address2"
          bind:value={formAddress2}
          placeholder="e.g. Suite 400"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="location_city">City <span class="text-destructive">*</span></Label>
          <Input
            id="location_city"
            name="location_city"
            bind:value={formCity}
            placeholder="e.g. Chennai"
          />
        </div>
        <div class="space-y-2">
          <Label for="location_pincode">Pin Code <span class="text-destructive">*</span></Label>
          <Input
            id="location_pincode"
            name="location_pincode"
            bind:value={formPinCode}
            placeholder="e.g. 600001"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2 flex flex-col justify-end">
          <Label for="location_country" class="mb-2">Country <span class="text-destructive">*</span></Label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button
                  id="location_country"
                  variant="outline"
                  class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 transition-[color,box-shadow] outline-none"
                  {...props}
                >
                  <span class="truncate">{countries.find((c) => c.cuid === formCountryCuid)?.country_name || "Select Country"}</span>
                  <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-56 overflow-y-auto w-[200px]">
              <DropdownMenu.Group>
                <DropdownMenu.Item
                  onclick={() => { formCountryCuid = ''; formStateCuid = ''; }}
                  class="cursor-pointer justify-between {!formCountryCuid ? 'bg-accent font-semibold' : ''}"
                >
                  Select Country
                </DropdownMenu.Item>
                {#each countries as country}
                  <DropdownMenu.Item
                    onclick={() => { formCountryCuid = country.cuid; formStateCuid = ''; }}
                    class="cursor-pointer justify-between {formCountryCuid === country.cuid ? 'bg-accent font-semibold' : ''}"
                  >
                    {country.country_name}
                    {#if formCountryCuid === country.cuid}<CheckIcon class="size-4" />{/if}
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onclick={openAddCountryModal}
                class="cursor-pointer font-medium text-[#F45310] hover:text-[#F45310]/90 focus:text-[#F45310]"
              >
                <PlusIcon class="mr-2 size-4" />
                Add Country
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
        <div class="space-y-2 flex flex-col justify-end">
          <Label for="location_state" class="mb-2">State <span class="text-destructive">*</span></Label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button
                  id="location_state"
                  variant="outline"
                  disabled={!formCountryCuid}
                  class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 transition-[color,box-shadow] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  {...props}
                >
                  <span class="truncate">{filteredStates.find((s) => s.cuid === formStateCuid)?.state_name || "Select State"}</span>
                  <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-56 overflow-y-auto w-[200px]">
              <DropdownMenu.Group>
                <DropdownMenu.Item
                  onclick={() => { formStateCuid = ''; }}
                  class="cursor-pointer justify-between {!formStateCuid ? 'bg-accent font-semibold' : ''}"
                >
                  Select State
                </DropdownMenu.Item>
                {#each filteredStates as state}
                  <DropdownMenu.Item
                    onclick={() => { formStateCuid = state.cuid; }}
                    class="cursor-pointer justify-between {formStateCuid === state.cuid ? 'bg-accent font-semibold' : ''}"
                  >
                    {state.state_name}
                    {#if formStateCuid === state.cuid}<CheckIcon class="size-4" />{/if}
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onclick={openAddStateModal}
                disabled={!formCountryCuid}
                class="cursor-pointer font-medium text-[#F45310] hover:text-[#F45310]/90 focus:text-[#F45310] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon class="mr-2 size-4" />
                Add State
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="location_timezone">Timezone <span class="text-destructive">*</span></Label>
        <Input
          id="location_timezone"
          name="location_timezone"
          bind:value={formTimezone}
          placeholder="e.g. Asia/Kolkata or UTC"
        />
      </div>

      {#if editLocation}
        <StatusDropdown id="location_status" name="location_status" value={formStatus} onChange={(val) => (formStatus = val)} />
      {/if}

      <div class="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onclick={cancel} disabled={formLoading}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={formLoading || (!!editLocation && !isDirty) || (!editLocation && !isCreateEnabled)}>
          {formLoading ? UI_CONSTANTS.BUTTON_SAVING : (editLocation ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>

<CrudModal
  open={showAddCountry}
  title="Add Country"
  isDirty={newCountryName.trim() !== ""}
  isSubmitting={addCountryLoading}
  onClose={() => { showAddCountry = false; newCountryName = ""; addCountryError = ""; }}
>
  {#snippet children({ cancel })}
    <form class="space-y-4" onsubmit={handleAddCountrySubmit}>
      <div class="space-y-2">
        <Label for="new_country_name">Country Name <span class="text-destructive">*</span></Label>
        <Input
          id="new_country_name"
          name="new_country_name"
          bind:value={newCountryName}
          class={addCountryError ? 'border-destructive' : ''}
          placeholder="e.g. India"
          oninput={() => { addCountryError = ''; }}
        />
        {#if addCountryError}
          <p class="text-xs text-destructive">{addCountryError}</p>
        {/if}
      </div>
      <div class="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onclick={cancel} disabled={addCountryLoading}>Cancel</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={addCountryLoading || !newCountryName.trim()}>
          {addCountryLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>

<CrudModal
  open={showAddState}
  title="Add State"
  isDirty={newStateName.trim() !== ""}
  isSubmitting={addStateLoading}
  onClose={() => { showAddState = false; newStateName = ""; addStateError = ""; }}
>
  {#snippet children({ cancel })}
    <form class="space-y-4" onsubmit={handleAddStateSubmit}>
      <div class="space-y-2">
        <Label for="new_state_name">State Name <span class="text-destructive">*</span></Label>
        <Input
          id="new_state_name"
          name="new_state_name"
          bind:value={newStateName}
          class={addStateError ? 'border-destructive' : ''}
          placeholder="e.g. Tamil Nadu"
          oninput={() => { addStateError = ''; }}
        />
        {#if addStateError}
          <p class="text-xs text-destructive">{addStateError}</p>
        {/if}
      </div>
      <div class="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onclick={cancel} disabled={addStateLoading}>Cancel</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={addStateLoading || !newStateName.trim()}>
          {addStateLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>
