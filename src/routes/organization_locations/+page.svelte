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
  import LocationModal from "$lib/components/organization_locations/LocationModal.svelte";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
  import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import CheckIcon from "@lucide/svelte/icons/check";
  import { toast } from "$lib/toast";
  import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';
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

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let confirmModalOpen = $state(false);
  let confirmModalTitle = $state('');
  let confirmModalDescription = $state('');
  let confirmModalConfirmLabel = $state('Confirm');
  let confirmModalCancelLabel = $state('Cancel');
  let confirmModalIsSubmitting = $state(false);
  let confirmModalOnConfirm = $state<() => void | Promise<void>>(() => {});
  let confirmModalOnCancel = $state<() => void>(() => {});

  let locations = $derived<CompanyLocation[]>(data.locations);
  let page = $state(1);
  let limit = $state(10);
  let loading = $state(false);
  let searchQuery = $state("");
  let editLocation = $state<CompanyLocation | null>(null);

  // Modal state
  let showForm = $state(false);

  // Dropdown choices
  let countries = $derived(data.countries);
  let states = $derived(data.states);



  function getCountryName(countryCuid: string): string {
    const country = countries.find((c) => c.cuid === countryCuid);
    return country ? country.name : countryCuid;
  }

  function getStateName(stateCuid: string): string {
    const state = states.find((s) => s.cuid === stateCuid);
    return state ? state.name : stateCuid;
  }

  // Filter
  let filterStatus = $state<"all" | boolean>("all");
  let filterCountry = $state<string>("all");
  let filterState = $state<string>("all");

  let selectedCountryLabel = $derived(
    filterCountry === "all"
      ? "All Countries"
      : countries.find((c) => c.cuid === filterCountry)?.name ||
          "All Countries"
  );

  let selectedStateLabel = $derived(
    filterState === "all"
      ? "All States"
      : states.find((s) => s.cuid === filterState)?.name || "All States"
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
      list = locations.filter((loc) => loc.status === filterStatus);
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
        const locName = (loc.name ?? "").toLowerCase();
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
    locations.filter((loc) => loc.status).length
  );
  let inactiveLocationsCount = $derived(
    locations.filter((loc) => !loc.status).length
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
    showForm = true;
  }

  function openEdit(loc: CompanyLocation) {
    editLocation = loc;
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editLocation = null;
  }

  async function deactivateLocation(cuid: string) {
    const loc = locations.find((l) => l.cuid === cuid);
    const name = loc ? loc.name : '';
    confirmModalTitle = "Deactivate Location";
    confirmModalDescription = `Are you sure you want to deactivate ${name}?`;
    confirmModalConfirmLabel = "Deactivate";
    confirmModalCancelLabel = "Cancel";
    confirmModalOnConfirm = async () => {
      try {
        await deleteLocation(cuid);
        await fetchLocations();
        toast.success("Company Location deactivated successfully");
      } catch (e) {
        toast.error(
          e instanceof ApiError ? e.message : "Failed to deactivate location"
        );
      }
    };
    confirmModalOnCancel = () => {};
    confirmModalOpen = true;
  }

  async function activateLocation(cuid: string) {
    const loc = locations.find((l) => l.cuid === cuid);
    const name = loc ? loc.name : '';
    confirmModalTitle = "Activate Location";
    confirmModalDescription = `Are you sure you want to activate ${name}?`;
    confirmModalConfirmLabel = "Activate";
    confirmModalCancelLabel = "Cancel";
    confirmModalOnConfirm = async () => {
      try {
        await activateLocationApi(cuid);
        await fetchLocations();
        toast.success("Company Location activated successfully");
      } catch (e) {
        toast.error(
          e instanceof ApiError ? e.message : "Failed to activate location"
        );
      }
    };
    confirmModalOnCancel = () => {};
    confirmModalOpen = true;
  }



  onMount(async () => {
    // Initial load provided via SSR (+page.server.ts)
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
                {c.name}
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
                {s.name}
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
              <Button variant="ghost" size="sm" class="-ml-2.5 h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('name')}>
                Location Name
                {#if sortColumn === 'name' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'name' && sortDirection === 'desc'}
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
            <TableHead class="font-bold text-foreground text-[15px]">Coordinates</TableHead>
            <TableHead class="text-center font-bold text-foreground text-[15px] whitespace-nowrap">
              <Button variant="ghost" size="sm" class="h-8 font-bold text-foreground text-[15px]" onclick={() => toggleSort('status')}>
                Status
                {#if sortColumn === 'status' && sortDirection === 'asc'}
                  <ArrowUpIcon class="ml-2 size-4" />
                {:else if sortColumn === 'status' && sortDirection === 'desc'}
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
              <TableCell colspan={10} class="py-8 text-center text-muted-foreground">
                <LoaderCircleIcon class="mx-auto mb-2 size-6 animate-spin" />
                Loading locations...
              </TableCell>
            </TableRow>
          {:else if filteredLocations.length === 0}
            <TableRow>
              <TableCell colspan={10} class="py-8 text-center text-muted-foreground">
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
                  <span class="font-semibold">{loc.name}</span>
                </TableCell>
                <TableCell>
                  {loc.address_line1}{loc.address_line2 ? ", " + loc.address_line2 : ""}
                </TableCell>
                <TableCell>{loc.city}</TableCell>
                <TableCell>{getStateName(loc.state_cuid)}</TableCell>
                <TableCell>{getCountryName(loc.country_cuid)}</TableCell>
                <TableCell>{loc.pin_code}</TableCell>
                <TableCell>{loc.timezone}</TableCell>
                <TableCell class="text-[14px]">
                  {#if loc.latitude !== null && loc.longitude !== null}
                    {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                  {:else}
                    -
                  {/if}
                </TableCell>
                <TableCell class="text-center">
                  <Badge variant={loc.status === true ? 'default' : 'secondary'}>{loc.status ? 'Active' : 'Inactive'}</Badge>
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



<LocationModal bind:open={showForm} {editLocation} onSuccess={fetchLocations} />

<ConfirmModal
  open={confirmModalOpen}
  title={confirmModalTitle}
  description={confirmModalDescription}
  confirmLabel={confirmModalConfirmLabel}
  cancelLabel={confirmModalCancelLabel}
  isSubmitting={confirmModalIsSubmitting}
  onConfirm={async () => {
    confirmModalIsSubmitting = true;
    try {
      await confirmModalOnConfirm();
    } finally {
      confirmModalIsSubmitting = false;
      confirmModalOpen = false;
    }
  }}
  onCancel={() => {
    confirmModalOnCancel();
    confirmModalOpen = false;
  }}
/>
