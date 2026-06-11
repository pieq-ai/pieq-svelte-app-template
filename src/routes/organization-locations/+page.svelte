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
    StatusBadge,
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
  let errors = $state<Record<string, string>>({});
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

  let isSubmitDisabled = $derived.by(() => {
    if (formLoading) return true;
    if (
      !formName.trim() ||
      !formAddress1.trim() ||
      !formCity.trim() ||
      !formCountryCuid ||
      !formStateCuid ||
      !formPinCode.trim() ||
      !formTimezone.trim()
    ) {
      return true;
    }
    if (editLocation) {
      return !isDirty;
    }
    return false;
  });

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
    } else {
      list.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
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
    errors = {};
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
    errors = {};
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
    errors = {};
    editLocation = null;
  }

  function attemptCloseForm() {
    closeForm();
  }

  async function submitForm(e: Event) {
    e.preventDefault();
    errors = {};

    const nameTrimmed = formName.trim();
    const lower = nameTrimmed.toLowerCase();
    if (!nameTrimmed) {
      errors.location_name = "Company Location name is required.";
    } else if (nameTrimmed.length < 2) {
      errors.location_name = "Company Location name must be at least 2 characters.";
    } else if (nameTrimmed.length > 150) {
      errors.location_name = "Company Location name cannot exceed 150 characters.";
    } else if (
      lower.includes("<script") ||
      lower.includes("script>") ||
      lower.includes("drop table") ||
      lower.includes("select ") ||
      lower.includes("--") ||
      lower.includes("/*")
    ) {
      errors.location_name = "Company Location name contains potential security threat.";
    } else if (/^\d+$/.test(nameTrimmed)) {
      errors.location_name = "Company Location name cannot contain only numbers.";
    } else if (!/[A-Za-z]/.test(nameTrimmed)) {
      errors.location_name = "Company Location name must contain at least one alphabet.";
    } else if (/[A-Za-z]\d|\d[A-Za-z]/.test(nameTrimmed)) {
      errors.location_name = "Company Location name cannot contain numbers.";
    }

    const address1Trimmed = formAddress1.trim();
    if (!address1Trimmed) {
      errors.address_line1 = "Address Line 1 is required.";
    } else if (address1Trimmed.length > 255) {
      errors.address_line1 = "Address Line 1 cannot exceed 255 characters.";
    }

    const address2Trimmed = formAddress2 ? formAddress2.trim() : "";
    if (address2Trimmed.length > 255) {
      errors.address_line2 = "Address Line 2 cannot exceed 255 characters.";
    }

    const cityTrimmed = formCity.trim();
    if (!cityTrimmed) {
      errors.city = "City is required.";
    } else if (cityTrimmed.length < 2) {
      errors.city = "City must be at least 2 characters.";
    } else if (cityTrimmed.length > 100) {
      errors.city = "City cannot exceed 100 characters.";
    } else if (!/^[a-zA-Z\s.-]+$/.test(cityTrimmed)) {
      errors.city = "City can contain only letters, spaces, hyphens, and periods.";
    }

    if (!formCountryCuid) {
      errors.country_cuid = "Country is required.";
    }
    if (!formStateCuid) {
      errors.state_cuid = "State is required.";
    }

    const pinTrimmed = formPinCode.trim();
    if (!pinTrimmed) {
      errors.pin_code = "Pin Code is required.";
    } else if (!/^\d+$/.test(pinTrimmed)) {
      errors.pin_code = "Pin Code must contain numeric values only.";
    } else if (pinTrimmed.length > 10) {
      errors.pin_code = "Pin Code cannot exceed 10 characters.";
    }

    const tzTrimmed = formTimezone.trim();
    if (!tzTrimmed) {
      errors.timezone = "Timezone is required.";
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    formLoading = true;
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
        is_active: formStatus
      };
      if (editLocation) {
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
    } catch (e: any) {
      if (e instanceof ApiError && e.data?.errors) {
        errors = e.data.errors;
      } else {
        errors.general = e instanceof ApiError ? e.message : "Something went wrong.";
      }
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

    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => toggleSort('location_name')}>
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
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => toggleSort('address_line1')}>
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
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => toggleSort('city')}>
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
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => toggleSort('state_cuid')}>
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
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => toggleSort('country_cuid')}>
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
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => toggleSort('pin_code')}>
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
            <TableHead>
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8" onclick={() => toggleSort('timezone')}>
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
            <TableHead class="w-24 text-center">
              <Button variant="ghost" size="sm" class="h-8" onclick={() => toggleSort('is_active')}>
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
            <TableHead class="text-right">Actions</TableHead>
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
                <TableCell class="font-normal">
                  <div>{loc.location_name}</div>
                </TableCell>
                <TableCell class="font-normal">
                  {loc.address_line1}{loc.address_line2 ? ", " + loc.address_line2 : ""}
                </TableCell>
                <TableCell class="font-normal">{loc.city}</TableCell>
                <TableCell class="font-normal">{getStateName(loc.state_cuid)}</TableCell>
                <TableCell class="font-normal">{getCountryName(loc.country_cuid)}</TableCell>
                <TableCell class="font-normal">{loc.pin_code}</TableCell>
                <TableCell class="font-normal">{loc.timezone}</TableCell>
                <TableCell class="text-center font-normal">
                  <StatusBadge status={loc.is_active} />
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
        <Label for="location_name" class={errors.location_name ? 'text-danger' : ''}>Location Name <span class="text-destructive">*</span></Label>
        <Input
          id="location_name"
          name="location_name"
          bind:value={formName}
          class={errors.location_name ? 'border-destructive' : ''}
          placeholder="e.g. Chennai - HQ"
          oninput={() => { errors.location_name = ''; }}
        />
        {#if errors.location_name}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.location_name}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="location_address1" class={errors.address_line1 ? 'text-danger' : ''}>Address Line 1 <span class="text-destructive">*</span></Label>
        <Input
          id="location_address1"
          name="location_address1"
          bind:value={formAddress1}
          class={errors.address_line1 ? 'border-destructive' : ''}
          placeholder="e.g. 123 Enterprise Way"
          oninput={() => { errors.address_line1 = ''; }}
        />
        {#if errors.address_line1}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.address_line1}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="location_address2" class={errors.address_line2 ? 'text-danger' : ''}>Address Line 2 (Optional)</Label>
        <Input
          id="location_address2"
          name="location_address2"
          bind:value={formAddress2}
          class={errors.address_line2 ? 'border-destructive' : ''}
          placeholder="e.g. Suite 400"
          oninput={() => { errors.address_line2 = ''; }}
        />
        {#if errors.address_line2}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.address_line2}</p>
        {/if}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="location_city" class={errors.city ? 'text-danger' : ''}>City <span class="text-destructive">*</span></Label>
          <Input
            id="location_city"
            name="location_city"
            bind:value={formCity}
            class={errors.city ? 'border-destructive' : ''}
            placeholder="e.g. Chennai"
            oninput={() => { errors.city = ''; }}
          />
          {#if errors.city}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.city}</p>
          {/if}
        </div>
        <div class="space-y-2">
          <Label for="location_pincode" class={errors.pin_code ? 'text-danger' : ''}>Pin Code <span class="text-destructive">*</span></Label>
          <Input
            id="location_pincode"
            name="location_pincode"
            bind:value={formPinCode}
            class={errors.pin_code ? 'border-destructive' : ''}
            placeholder="e.g. 600001"
            oninput={() => { errors.pin_code = ''; }}
          />
          {#if errors.pin_code}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.pin_code}</p>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2 flex flex-col justify-end">
          <Label for="location_country" class="mb-2 {errors.country_cuid ? 'text-danger' : ''}">Country <span class="text-destructive">*</span></Label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button
                  id="location_country"
                  variant="outline"
                  class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 transition-[color,box-shadow] outline-none {errors.country_cuid ? 'border-destructive' : ''}"
                  {...props}
                >
                  <span class="truncate">{countries.find((c) => c.cuid === formCountryCuid)?.country_name || "Select Country"}</span>
                  <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-56 flex flex-col w-[200px] p-0 overflow-hidden">
              <div class="max-h-44 overflow-y-auto p-1 flex-1">
                <DropdownMenu.Group>
                  {#each countries as country}
                    <DropdownMenu.Item
                      onclick={() => { formCountryCuid = country.cuid; formStateCuid = ''; errors.country_cuid = ''; }}
                      class="cursor-pointer justify-between {formCountryCuid === country.cuid ? 'bg-accent font-semibold' : ''}"
                    >
                      {country.country_name}
                      {#if formCountryCuid === country.cuid}<CheckIcon class="size-4" />{/if}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </div>
              <div class="border-t border-border p-1 bg-muted/20 flex-shrink-0">
                <button
                  type="button"
                  class="flex items-center justify-center gap-1.5 w-full rounded-sm px-2 py-1.5 text-xs font-medium border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none"
                  onclick={(e) => {
                    e.stopPropagation();
                    openAddCountryModal();
                  }}
                >
                  <PlusIcon class="size-3.5" />
                  Add Country
                </button>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          {#if errors.country_cuid}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.country_cuid}</p>
          {/if}
        </div>
        <div class="space-y-2 flex flex-col justify-end">
          <Label for="location_state" class="mb-2 {errors.state_cuid ? 'text-danger' : ''}">State <span class="text-destructive">*</span></Label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button
                  id="location_state"
                  variant="outline"
                  disabled={!formCountryCuid}
                  class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 transition-[color,box-shadow] outline-none disabled:opacity-50 disabled:cursor-not-allowed {errors.state_cuid ? 'border-destructive' : ''}"
                  {...props}
                >
                  <span class="truncate">{filteredStates.find((s) => s.cuid === formStateCuid)?.state_name || "Select State"}</span>
                  <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-56 flex flex-col w-[200px] p-0 overflow-hidden">
              <div class="max-h-44 overflow-y-auto p-1 flex-1">
                <DropdownMenu.Group>
                  {#each filteredStates as state}
                    <DropdownMenu.Item
                      onclick={() => { formStateCuid = state.cuid; errors.state_cuid = ''; }}
                      class="cursor-pointer justify-between {formStateCuid === state.cuid ? 'bg-accent font-semibold' : ''}"
                    >
                      {state.state_name}
                      {#if formStateCuid === state.cuid}<CheckIcon class="size-4" />{/if}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </div>
              <div class="border-t border-border p-1 bg-muted/20 flex-shrink-0">
                <button
                  type="button"
                  disabled={!formCountryCuid}
                  class="flex items-center justify-center gap-1.5 w-full rounded-sm px-2 py-1.5 text-xs font-medium border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onclick={(e) => {
                    e.stopPropagation();
                    openAddStateModal();
                  }}
                >
                  <PlusIcon class="size-3.5" />
                  Add State
                </button>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          {#if errors.state_cuid}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.state_cuid}</p>
          {/if}
        </div>
      </div>

      <div class="space-y-2">
        <Label for="location_timezone" class={errors.timezone ? 'text-danger' : ''}>Timezone <span class="text-destructive">*</span></Label>
        <Input
          id="location_timezone"
          name="location_timezone"
          bind:value={formTimezone}
          class={errors.timezone ? 'border-destructive' : ''}
          placeholder="e.g. Asia/Kolkata or UTC"
          oninput={() => { errors.timezone = ''; }}
        />
        {#if errors.timezone}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{errors.timezone}</p>
        {/if}
      </div>

      <StatusDropdown id="location_status" name="location_status" value={formStatus} onChange={(val) => (formStatus = val)} />

      {#if errors.general}
        <div class="p-3 bg-destructive/15 text-destructive rounded-md text-sm">
          {errors.general}
        </div>
      {/if}

      <div class="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onclick={cancel} disabled={formLoading}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={isSubmitDisabled}>
          {formLoading ? UI_CONSTANTS.BUTTON_SAVING : (editLocation ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE)}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>

<CrudModal
  open={showAddCountry}
  title="Add Country"
  description="Create a new country master record."
  isDirty={newCountryName.trim() !== ""}
  isSubmitting={addCountryLoading}
  onClose={() => { showAddCountry = false; newCountryName = ""; addCountryError = ""; }}
>
  {#snippet children({ cancel })}
    <form class="flex flex-col min-h-0 flex-1 overflow-hidden" onsubmit={handleAddCountrySubmit}>
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 modal-scroll-area">
        <div class="space-y-2">
          <Label for="new_country_name" class={addCountryError ? 'text-danger' : ''}>Country Name <span class="text-destructive">*</span></Label>
          <Input
            id="new_country_name"
            bind:value={newCountryName}
            class={addCountryError ? 'border-danger focus-visible:ring-danger/30' : ''}
            placeholder="e.g. India"
            oninput={() => { addCountryError = ''; }}
          />
          {#if addCountryError}
            <p class="text-xs font-medium text-danger mt-1">{addCountryError}</p>
          {/if}
        </div>
      </div>
      <div class="flex items-center justify-end gap-3 pt-6 flex-shrink-0">
        <Button type="button" variant="outline" onclick={cancel} disabled={addCountryLoading}>Cancel</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={addCountryLoading || !newCountryName.trim()}>
          {#if addCountryLoading}
            <LoaderCircleIcon class="size-4 animate-spin" />
            Saving...
          {:else}
            Save
          {/if}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>

<CrudModal
  open={showAddState}
  title="Add State"
  description="Create a new state master record."
  isDirty={newStateName.trim() !== ""}
  isSubmitting={addStateLoading}
  onClose={() => { showAddState = false; newStateName = ""; addStateError = ""; }}
>
  {#snippet children({ cancel })}
    <form class="flex flex-col min-h-0 flex-1 overflow-hidden" onsubmit={handleAddStateSubmit}>
      <div class="flex-1 overflow-y-auto pr-1 space-y-4 modal-scroll-area">
        <div class="space-y-2">
          <Label for="new_state_name" class={addStateError ? 'text-danger' : ''}>State Name <span class="text-destructive">*</span></Label>
          <Input
            id="new_state_name"
            bind:value={newStateName}
            class={addStateError ? 'border-danger focus-visible:ring-danger/30' : ''}
            placeholder="e.g. Tamil Nadu"
            oninput={() => { addStateError = ''; }}
          />
          {#if addStateError}
            <p class="text-xs font-medium text-danger mt-1">{addStateError}</p>
          {/if}
        </div>
      </div>
      <div class="flex items-center justify-end gap-3 pt-6 flex-shrink-0">
        <Button type="button" variant="outline" onclick={cancel} disabled={addStateLoading}>Cancel</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={addStateLoading || !newStateName.trim()}>
          {#if addStateLoading}
            <LoaderCircleIcon class="size-4 animate-spin" />
            Saving...
          {:else}
            Save
          {/if}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>
