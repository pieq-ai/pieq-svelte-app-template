<script lang="ts">
  import { onMount } from "svelte";
  import type { CompanyLocation } from "$lib/types/organization_location";
  import {
    fetchCountries,
    fetchStates,
    createLocation,
    updateLocation,
    createCountry,
    createState,
  } from "$lib/api/locations";
  import { ApiError } from "$lib/api/local";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import CheckIcon from "@lucide/svelte/icons/check";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import { toast } from "$lib/toast";
  import { createDirtyChecker } from "$lib/utils";
  import { UI_CONSTANTS } from "$lib/constants";
  import { globalIsDirty } from "$lib/stores/navigationGuard";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import {
    Button,
    Input,
    Label,
    CrudModal,
    StatusDropdown
  } from "$lib/components";
  import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';

  let { 
    open = $bindable(false), 
    editLocation = null, 
    onSuccess 
  }: { 
    open: boolean; 
    editLocation?: CompanyLocation | null; 
    onSuccess?: (loc: any) => void;
  } = $props();

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
  let showConfirmClose = $state(false);

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
    open &&
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

  $effect(() => {
    if (open && isDirty) {
      $globalIsDirty = true;
    } else if (!open) {
      $globalIsDirty = false;
    }
  });

  $effect(() => {
    if (open) {
      let initName = "";
      let initAddress1 = "";
      let initAddress2 = "";
      let initCity = "";
      let initCountry = "";
      let initState = "";
      let initPinCode = "";
      let initTimezone = "UTC";
      let initStatus = true;
      let initLatitude = "";
      let initLongitude = "";

      if (editLocation) {
        initName = editLocation.name;
        initAddress1 = editLocation.address_line1 ?? "";
        initAddress2 = editLocation.address_line2 ?? "";
        initCity = editLocation.city ?? "";
        initCountry = editLocation.country_cuid ?? "";
        initState = editLocation.state_cuid ?? "";
        initPinCode = editLocation.pin_code ?? "";
        initTimezone = editLocation.timezone ?? "UTC";
        initStatus = editLocation.status;
        initLatitude = editLocation.latitude !== null && editLocation.latitude !== undefined ? String(editLocation.latitude) : "";
        initLongitude = editLocation.longitude !== null && editLocation.longitude !== undefined ? String(editLocation.longitude) : "";
      }

      formName = initName;
      formAddress1 = initAddress1;
      formAddress2 = initAddress2;
      formCity = initCity;
      formCountryCuid = initCountry;
      formStateCuid = initState;
      formPinCode = initPinCode;
      formTimezone = initTimezone;
      formStatus = initStatus;
      formLatitude = initLatitude;
      formLongitude = initLongitude;

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
      
      dirtyChecker.snapshot({
        name: initName,
        address_line1: initAddress1,
        address_line2: initAddress2,
        city: initCity,
        state_cuid: initState,
        country_cuid: initCountry,
        pin_code: initPinCode,
        timezone: initTimezone,
        latitude: initLatitude,
        longitude: initLongitude,
        status: initStatus
      });
    }
  });

  let isCreateEnabled = $derived(
    formName.trim() !== "" &&
      formAddress1.trim() !== "" &&
      formCity.trim() !== "" &&
      formCountryCuid !== "" &&
      formStateCuid !== "" &&
      formPinCode.trim() !== "" &&
      formTimezone.trim() !== ""
  );

  let countries = $state<any[]>([]);
  let states = $state<any[]>([]);

  let filteredStates = $derived(
    states.filter((s) => s.country_cuid === formCountryCuid)
  );

  function getCountryName(countryCuid: string): string {
    const country = countries.find((c) => c.cuid === countryCuid);
    return country ? country.name : countryCuid;
  }

  function getStateName(stateCuid: string): string {
    const state = states.find((s) => s.cuid === stateCuid);
    return state ? state.name : stateCuid;
  }

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

  onMount(() => {
    fetchDropdowns();
  });

  let isFetchingLocation = $state(false);

  function handleGetCoordinates() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    isFetchingLocation = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        formLatitude = position.coords.latitude.toFixed(8);
        formLongitude = position.coords.longitude.toFixed(8);
        latitudeError = "";
        longitudeError = "";
        isFetchingLocation = false;
        toast.success("Location coordinates retrieved successfully.");
      },
      (error) => {
        isFetchingLocation = false;
        console.warn("Geolocation failed:", error);
        let errorMsg = "Failed to retrieve location coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Geolocation permission denied by the browser.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location retrieval request timed out.";
        }
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      nameError = "Company Location name cannot exceed 150 characters.";
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
      let res: any;
      if (editLocation) {
        payload.status = formStatus;
        res = await updateLocation(editLocation.cuid, payload);
      } else {
        res = await createLocation(payload);
      }
      open = false;
      $globalIsDirty = false;
      toast.success(
        editLocation
          ? "Company Location updated successfully"
          : "Company Location created successfully"
      );
      onSuccess?.(res);
    } catch (e) {
      const errMsg = e instanceof ApiError ? e.message : "Something went wrong.";
      formError = errMsg;
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

  function handleClose() {
    if (isDirty) {
      showConfirmClose = true;
    } else {
      open = false;
      $globalIsDirty = false;
    }
  }

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
</script>

<CrudModal
  {open}
  title={editLocation ? 'Edit Location' : 'Create Location'}
  isSubmitting={formLoading}
  onClose={handleClose}
>
  {#snippet children({ cancel })}
    <form class="space-y-4" onsubmit={submitForm}>


      <div class="space-y-2">
        <Label for="name">Location Name <span class="text-destructive">*</span></Label>
        <Input
          id="name"
          name="name"
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
                    onclick={() => { formCountryCuid = country.cuid; formStateCuid = ''; countryError = ''; }}
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
                    onclick={() => { formStateCuid = state.cuid; stateError = ''; }}
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

      <div class="pt-1">
        <Button
          type="button"
          variant="outline"
          class="w-full text-xs font-semibold flex items-center justify-center gap-2"
          onclick={handleGetCoordinates}
          disabled={isFetchingLocation}
        >
          {#if isFetchingLocation}
            <LoaderCircleIcon class="h-4 w-4 animate-spin" />
            Fetching Location...
          {:else}
            Get Coordinates
          {/if}
        </Button>
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

<ConfirmModal
  open={showConfirmClose}
  title="Cancel Changes"
  description="Are you sure you want to cancel? All unsaved changes will be lost."
  confirmLabel="Cancel"
  cancelLabel="Keep Editing"
  onConfirm={() => {
    showConfirmClose = false;
    open = false;
    $globalIsDirty = false;
  }}
  onCancel={() => {
    showConfirmClose = false;
  }}
/>

<CrudModal
  open={showAddCountry}
  title="Add Country"
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
          placeholder="Enter country name"
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
          placeholder="Enter state name"
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
