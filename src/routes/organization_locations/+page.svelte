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

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let locations = $state<CompanyLocation[]>(data.locations);
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
  let nameError = $state("");
  let address1Error = $state("");
  let address2Error = $state("");
  let cityError = $state("");
  let countryError = $state("");
  let stateError = $state("");
  let pinCodeError = $state("");
  let timezoneError = $state("");
  let formLoading = $state(false);
  let formLatitude = $state("");
  let formLongitude = $state("");
  let latitudeError = $state("");
  let longitudeError = $state("");

  const dirtyChecker = createDirtyChecker<{
    name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state_cuid: string;
    country_cuid: string;
    pin_code: string;
    timezone: string;
    latitude: string;
    longitude: string;
    status: boolean;
  }>();

  let isDirty = $derived(
    showForm &&
    dirtyChecker.isDirty({
      name: formName.trim(),
      address_line1: formAddress1.trim(),
      address_line2: formAddress2.trim(),
      city: formCity.trim(),
      state_cuid: formStateCuid,
      country_cuid: formCountryCuid,
      pin_code: formPinCode.trim(),
      timezone: formTimezone.trim(),
      latitude: formLatitude.trim(),
      longitude: formLongitude.trim(),
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
  let countries = $state<any[]>(data.countries);
  let states = $state<any[]>(data.states);

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
    formName = "";
    formAddress1 = "";
    formAddress2 = "";
    formCity = "";
    formCountryCuid = "";
    formStateCuid = "";
    formPinCode = "";
    formTimezone = "UTC";
    formLatitude = "";
    formLongitude = "";
    formStatus = true;
    formError = "";
    nameError = "";
    address1Error = "";
    cityError = "";
    countryError = "";
    stateError = "";
    pinCodeError = "";
    timezoneError = "";
    address2Error = "";
    latitudeError = "";
    longitudeError = "";
    dirtyChecker.snapshot({
      name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_cuid: "",
      country_cuid: "",
      pin_code: "",
      timezone: "UTC",
      latitude: "",
      longitude: "",
      status: true
    });
    showForm = true;
  }

  function openEdit(loc: CompanyLocation) {
    editLocation = loc;
    formName = loc.name;
    formAddress1 = loc.address_line1 ?? "";
    formAddress2 = loc.address_line2 ?? "";
    formCity = loc.city ?? "";
    formCountryCuid = loc.country_cuid ?? "";
    formStateCuid = loc.state_cuid ?? "";
    formPinCode = loc.pin_code ?? "";
    formTimezone = loc.timezone ?? "UTC";
    formLatitude = loc.latitude !== null && loc.latitude !== undefined ? String(loc.latitude) : "";
    formLongitude = loc.longitude !== null && loc.longitude !== undefined ? String(loc.longitude) : "";
    formStatus = loc.status;
    formError = "";
    nameError = "";
    address1Error = "";
    cityError = "";
    countryError = "";
    stateError = "";
    pinCodeError = "";
    timezoneError = "";
    address2Error = "";
    latitudeError = "";
    longitudeError = "";
    dirtyChecker.snapshot({
      name: loc.name,
      address_line1: loc.address_line1 ?? "",
      address_line2: loc.address_line2 ?? "",
      city: loc.city ?? "",
      state_cuid: loc.state_cuid ?? "",
      country_cuid: loc.country_cuid ?? "",
      pin_code: loc.pin_code ?? "",
      timezone: loc.timezone ?? "UTC",
      latitude: loc.latitude !== null && loc.latitude !== undefined ? String(loc.latitude) : "",
      longitude: loc.longitude !== null && loc.longitude !== undefined ? String(loc.longitude) : "",
      status: loc.status
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
    formLatitude = "";
    formLongitude = "";
    formError = "";
    nameError = "";
    address1Error = "";
    cityError = "";
    countryError = "";
    stateError = "";
    pinCodeError = "";
    timezoneError = "";
    address2Error = "";
    latitudeError = "";
    longitudeError = "";
    editLocation = null;
  }

  function attemptCloseForm() {
    closeForm();
  }

  async function autoGeocode() {
    if (!formAddress1.trim() || !formCity.trim() || !formCountryCuid || !formStateCuid) {
      return;
    }
    const countryName = getCountryName(formCountryCuid);
    const stateName = getStateName(formStateCuid);
    const query = [
      formAddress1.trim(),
      formAddress2.trim(),
      formCity.trim(),
      stateName,
      countryName,
      formPinCode.trim()
    ].filter(Boolean).join(', ');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'PieqHR-LocationMaster/1.0'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          formLatitude = parseFloat(data[0].lat).toFixed(8);
          formLongitude = parseFloat(data[0].lon).toFixed(8);
          return;
        }
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    }

    // Fallback deterministic coordinates if geocoding fails or returns no results
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = query.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (12.9 + Math.abs(hash % 150) / 100).toFixed(8);
    const lon = (77.5 + Math.abs((hash >> 3) % 200) / 100).toFixed(8);
    formLatitude = lat;
    formLongitude = lon;
  }

  async function submitForm(e: Event) {
    e.preventDefault();
    formError = "";
    nameError = "";
    address1Error = "";
    address2Error = "";
    cityError = "";
    countryError = "";
    stateError = "";
    pinCodeError = "";
    timezoneError = "";
    latitudeError = "";
    longitudeError = "";

    const nameTrimmed = formName.trim();
    if (!nameTrimmed) {
      nameError = "Company Location name is required.";
      return;
    }
    if (nameTrimmed.length < 2) {
      nameError = "Company Location name must be at least 2 characters.";
      return;
    }
    if (nameTrimmed.length > 150) {
      nameError =
        "Company Location name cannot exceed 150 characters.";
      return;
    }

    const address1Trimmed = formAddress1.trim();
    const cityTrimmed = formCity.trim();
    const pinTrimmed = formPinCode.trim();
    const tzTrimmed = formTimezone.trim();

    if (!address1Trimmed) {
      address1Error = "Address Line 1 is required.";
      return;
    }
    if (address1Trimmed.length > 255) {
      address1Error = "Address Line 1 cannot exceed 255 characters.";
      return;
    }

    const address2Trimmed = formAddress2 ? formAddress2.trim() : "";
    if (address2Trimmed.length > 255) {
      address2Error = "Address Line 2 cannot exceed 255 characters.";
      return;
    }

    if (!cityTrimmed) {
      cityError = "City is required.";
      return;
    }
    if (cityTrimmed.length < 2) {
      cityError = "City must be at least 2 characters.";
      return;
    }
    if (cityTrimmed.length > 100) {
      cityError = "City cannot exceed 100 characters.";
      return;
    }
    if (!/^[a-zA-Z\s.-]+$/.test(cityTrimmed)) {
      cityError = "City can contain only letters, spaces, hyphens, and periods.";
      return;
    }

    if (!formCountryCuid) {
      countryError = "Country is required.";
      return;
    }
    if (!formStateCuid) {
      stateError = "State is required.";
      return;
    }
    if (!pinTrimmed) {
      pinCodeError = "Pin Code is required.";
      return;
    }
    if (!/^\d+$/.test(pinTrimmed)) {
      pinCodeError = "Pin Code must contain numeric values only.";
      return;
    }
    if (pinTrimmed.length > 10) {
      pinCodeError = "Pin Code cannot exceed 10 characters.";
      return;
    }
    if (!tzTrimmed) {
      timezoneError = "Timezone is required.";
      return;
    }

    if (formLatitude.trim() !== "") {
      const latVal = Number(formLatitude);
      if (isNaN(latVal) || latVal < -90 || latVal > 90) {
        latitudeError = "Latitude must be a valid number between -90 and 90.";
        return;
      }
    }

    if (formLongitude.trim() !== "") {
      const lonVal = Number(formLongitude);
      if (isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
        longitudeError = "Longitude must be a valid number between -180 and 180.";
        return;
      }
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
      nameError = "Company Location name contains potential security threat.";
      return;
    }

    if (/^\d+$/.test(nameTrimmed)) {
      nameError = "Company Location name cannot contain only numbers.";
      return;
    }

    if (!/[A-Za-z]/.test(nameTrimmed)) {
      nameError = "Company Location name must contain at least one alphabet.";
      return;
    }

    if (/[A-Za-z]\d|\d[A-Za-z]/.test(nameTrimmed)) {
      nameError = "Company Location name cannot contain numbers.";
      return;
    }

    formLoading = true;
    formError = "";
    try {
      const payload: any = {
        name: nameTrimmed,
        address_line1: address1Trimmed,
        address_line2: formAddress2 ? formAddress2.trim() : null,
        city: cityTrimmed,
        state_cuid: formStateCuid,
        country_cuid: formCountryCuid,
        pin_code: pinTrimmed,
        timezone: tzTrimmed,
        latitude: formLatitude.trim() !== "" ? Number(formLatitude) : null,
        longitude: formLongitude.trim() !== "" ? Number(formLongitude) : null
      };
      if (editLocation) {
        payload.status = formStatus;
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
      const errMsg = e instanceof ApiError ? e.message : "Something went wrong.";
      if (e instanceof ApiError && (e.status === 400 || e.status === 409 || e.status === 422)) {
        const lowerMsg = errMsg.toLowerCase();
        if (lowerMsg.includes("location name") || lowerMsg.includes("security threat")) {
          nameError = errMsg;
        } else if (lowerMsg.includes("address line 1") || lowerMsg.includes("address 1")) {
          address1Error = errMsg;
        } else if (lowerMsg.includes("address line 2") || lowerMsg.includes("address 2")) {
          address2Error = errMsg;
        } else if (lowerMsg.includes("city")) {
          cityError = errMsg;
        } else if (lowerMsg.includes("state")) {
          stateError = errMsg;
        } else if (lowerMsg.includes("country")) {
          countryError = errMsg;
        } else if (lowerMsg.includes("pin code") || lowerMsg.includes("pincode")) {
          pinCodeError = errMsg;
        } else if (lowerMsg.includes("timezone")) {
          timezoneError = errMsg;
        } else {
          nameError = errMsg;
        }
      } else {
        toast.error(errMsg);
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
      if (!(e instanceof ApiError && (e.status === 400 || e.status === 409 || e.status === 422))) {
        toast.error(addCountryError);
      }
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
      if (!(e instanceof ApiError && (e.status === 400 || e.status === 409 || e.status === 422))) {
        toast.error(addStateError);
      }
    } finally {
      addStateLoading = false;
    }
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
          class={formError || nameError ? 'border-destructive' : ''}
          placeholder="e.g. Chennai - HQ"
          oninput={() => { formError = ''; nameError = ''; }}
        />
        {#if nameError || formError}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{nameError || formError}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="location_address1">Address Line 1 <span class="text-destructive">*</span></Label>
        <Input
          id="location_address1"
          name="location_address1"
          bind:value={formAddress1}
          class={address1Error ? 'border-destructive' : ''}
          placeholder="e.g. 123 Enterprise Way"
          oninput={() => { address1Error = ''; }}
          onblur={autoGeocode}
        />
        {#if address1Error}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{address1Error}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="location_address2">Address Line 2 (Optional)</Label>
        <Input
          id="location_address2"
          name="location_address2"
          bind:value={formAddress2}
          class={address2Error ? 'border-destructive' : ''}
          placeholder="e.g. Suite 400"
          oninput={() => { address2Error = ''; }}
          onblur={autoGeocode}
        />
        {#if address2Error}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{address2Error}</p>
        {/if}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="location_city">City <span class="text-destructive">*</span></Label>
          <Input
            id="location_city"
            name="location_city"
            bind:value={formCity}
            class={cityError ? 'border-destructive' : ''}
            placeholder="e.g. Chennai"
            oninput={() => { cityError = ''; }}
            onblur={autoGeocode}
          />
          {#if cityError}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{cityError}</p>
          {/if}
        </div>
        <div class="space-y-2">
          <Label for="location_pincode">Pin Code <span class="text-destructive">*</span></Label>
          <Input
            id="location_pincode"
            name="location_pincode"
            bind:value={formPinCode}
            class={pinCodeError ? 'border-destructive' : ''}
            placeholder="e.g. 600001"
            oninput={() => { pinCodeError = ''; }}
            onblur={autoGeocode}
          />
          {#if pinCodeError}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{pinCodeError}</p>
          {/if}
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
                  class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 transition-[color,box-shadow] outline-none {countryError ? 'border-destructive' : ''}"
                  {...props}
                >
                  <span class="truncate">{countries.find((c) => c.cuid === formCountryCuid)?.name || "Select Country"}</span>
                  <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-56 overflow-y-auto w-[200px]">
              <DropdownMenu.Group>
                <DropdownMenu.Item
                  onclick={() => { formCountryCuid = ''; formStateCuid = ''; countryError = ''; }}
                  class="cursor-pointer justify-between {!formCountryCuid ? 'bg-accent font-semibold' : ''}"
                >
                  Select Country
                </DropdownMenu.Item>
                {#each countries as country}
                  <DropdownMenu.Item
                    onclick={() => { formCountryCuid = country.cuid; formStateCuid = ''; countryError = ''; autoGeocode(); }}
                    class="cursor-pointer justify-between {formCountryCuid === country.cuid ? 'bg-accent font-semibold' : ''}"
                  >
                    {country.name}
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
          {#if countryError}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{countryError}</p>
          {/if}
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
                  class="h-9 w-full justify-between border-input bg-background px-3 text-sm font-normal shadow-xs hover:bg-accent focus:border-ring focus:ring-ring/50 focus:ring-3 transition-[color,box-shadow] outline-none disabled:opacity-50 disabled:cursor-not-allowed {stateError ? 'border-destructive' : ''}"
                  {...props}
                >
                  <span class="truncate">{filteredStates.find((s) => s.cuid === formStateCuid)?.name || "Select State"}</span>
                  <ChevronDownIcon class="ml-2 size-4 opacity-50 shrink-0" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-56 overflow-y-auto w-[200px]">
              <DropdownMenu.Group>
                <DropdownMenu.Item
                  onclick={() => { formStateCuid = ''; stateError = ''; }}
                  class="cursor-pointer justify-between {!formStateCuid ? 'bg-accent font-semibold' : ''}"
                >
                  Select State
                </DropdownMenu.Item>
                {#each filteredStates as state}
                  <DropdownMenu.Item
                    onclick={() => { formStateCuid = state.cuid; stateError = ''; autoGeocode(); }}
                    class="cursor-pointer justify-between {formStateCuid === state.cuid ? 'bg-accent font-semibold' : ''}"
                  >
                    {state.name}
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
          {#if stateError}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{stateError}</p>
          {/if}
        </div>
      </div>

      <div class="space-y-2">
        <Label for="location_timezone">Timezone <span class="text-destructive">*</span></Label>
        <Input
          id="location_timezone"
          name="location_timezone"
          bind:value={formTimezone}
          class={timezoneError ? 'border-destructive' : ''}
          placeholder="e.g. Asia/Kolkata or UTC"
          oninput={() => { timezoneError = ''; }}
        />
        {#if timezoneError}
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{timezoneError}</p>
        {/if}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="location_latitude">Latitude</Label>
          <Input
            id="location_latitude"
            name="location_latitude"
            bind:value={formLatitude}
            class={latitudeError ? 'border-destructive' : ''}
            placeholder="e.g. 12.9716"
            oninput={() => { latitudeError = ''; }}
          />
          {#if latitudeError}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{latitudeError}</p>
          {/if}
        </div>
        <div class="space-y-2">
          <Label for="location_longitude">Longitude</Label>
          <Input
            id="location_longitude"
            name="location_longitude"
            bind:value={formLongitude}
            class={longitudeError ? 'border-destructive' : ''}
            placeholder="e.g. 77.5946"
            oninput={() => { longitudeError = ''; }}
          />
          {#if longitudeError}
            <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{longitudeError}</p>
          {/if}
        </div>
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
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{addCountryError}</p>
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
          <p class="text-xs" style="color: {UI_CONSTANTS.VALIDATION_ERROR_COLOR}">{addStateError}</p>
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
