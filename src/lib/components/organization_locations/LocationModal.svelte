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
  import { toast } from "$lib/toast";
  import { createDirtyChecker } from "$lib/utils";
  import { UI_CONSTANTS } from "$lib/constants";
  import { globalIsDirty } from "$lib/stores/navigationGuard";
  import {
    Input,
    Label,
    Button,
    CrudModal,
    StatusDropdown,
    ConfirmModal
  } from "$lib/components";

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
  let formTimezone = $state("UTC");
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

  const dirtyChecker = createDirtyChecker<{
    name: string;
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

      formError = "";
      nameError = "";
      address1Error = "";
      address2Error = "";
      cityError = "";
      countryError = "";
      stateError = "";
      pinCodeError = "";
      timezoneError = "";
      
      dirtyChecker.snapshot({
        name: initName,
        address_line1: initAddress1,
        address_line2: initAddress2,
        city: initCity,
        state_cuid: initState,
        country_cuid: initCountry,
        pin_code: initPinCode,
        timezone: initTimezone,
        status: initStatus
      });
    }
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

  onMount(() => {
    fetchDropdowns();
  });

  // Create enablement
  let isCreateEnabled = $derived(
    formName.trim() !== "" &&
      formAddress1.trim() !== "" &&
      formCity.trim() !== "" &&
      formCountryCuid !== "" &&
      formStateCuid !== "" &&
      formPinCode.trim() !== "" &&
      formTimezone.trim() !== ""
  );

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
      };
      let res;
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
      formError = e instanceof ApiError ? e.message : "Something went wrong.";
      toast.error(formError);
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
</script>

<CrudModal
  {open}
  title={editLocation ? "Edit Location" : "Create Location"}
  isSubmitting={formLoading}
  isDirty={isDirty}
  onClose={handleClose}
>
  {#snippet children({ cancel })}
    <form class="space-y-4" onsubmit={submitForm}>
      {#if formError}
        <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">{formError}</div>
      {/if}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="name" class="font-medium">Company Location Name <span class="text-destructive">*</span></Label>
          <Input id="name" name="name" bind:value={formName} placeholder="e.g. New York Headquarters" class={nameError ? 'border-destructive focus-visible:ring-destructive' : ''} />
          {#if nameError}<p class="text-xs text-destructive mt-1">{nameError}</p>{/if}
        </div>
        <div class="space-y-2">
          <Label for="timezone" class="font-medium">Timezone <span class="text-destructive">*</span></Label>
          <Input id="timezone" name="timezone" bind:value={formTimezone} placeholder="e.g. UTC, America/New_York" class={timezoneError ? 'border-destructive focus-visible:ring-destructive' : ''} />
          {#if timezoneError}<p class="text-xs text-destructive mt-1">{timezoneError}</p>{/if}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="address_line1" class="font-medium">Address Line 1 <span class="text-destructive">*</span></Label>
          <Input id="address_line1" name="address_line1" bind:value={formAddress1} placeholder="e.g. 123 Business Rd." class={address1Error ? 'border-destructive focus-visible:ring-destructive' : ''} />
          {#if address1Error}<p class="text-xs text-destructive mt-1">{address1Error}</p>{/if}
        </div>
        <div class="space-y-2">
          <Label for="address_line2" class="font-medium">Address Line 2</Label>
          <Input id="address_line2" name="address_line2" bind:value={formAddress2} placeholder="e.g. Suite 400" class={address2Error ? 'border-destructive focus-visible:ring-destructive' : ''} />
          {#if address2Error}<p class="text-xs text-destructive mt-1">{address2Error}</p>{/if}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="country_cuid" class="font-medium">Country <span class="text-destructive">*</span></Label>
          <div class="flex gap-2">
            <select
              id="country_cuid"
              name="country_cuid"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {countryError ? 'border-destructive focus-visible:ring-destructive' : ''}"
              bind:value={formCountryCuid}
              onchange={() => (formStateCuid = "")}
            >
              <option value="" disabled selected>Select a country</option>
              {#each countries as c}
                <option value={c.cuid}>{c.name}</option>
              {/each}
            </select>
            <Button
              type="button"
              variant="outline"
              class="shrink-0 px-3 border-dashed hover:border-solid hover:bg-accent hover:text-accent-foreground group"
              onclick={openAddCountryModal}
              title="Add New Country"
            >
              <span class="font-bold text-lg text-muted-foreground group-hover:text-foreground transition-colors">+</span>
            </Button>
          </div>
          {#if countryError}<p class="text-xs text-destructive mt-1">{countryError}</p>{/if}
        </div>
        <div class="space-y-2">
          <Label for="state_cuid" class="font-medium">State/Province <span class="text-destructive">*</span></Label>
          <div class="flex gap-2">
            <select
              id="state_cuid"
              name="state_cuid"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {stateError ? 'border-destructive focus-visible:ring-destructive' : ''}"
              bind:value={formStateCuid}
              disabled={!formCountryCuid}
            >
              <option value="" disabled selected>Select a state</option>
              {#each filteredStates as s}
                <option value={s.cuid}>{s.name}</option>
              {/each}
            </select>
            <Button
              type="button"
              variant="outline"
              class="shrink-0 px-3 border-dashed hover:border-solid hover:bg-accent hover:text-accent-foreground group disabled:opacity-50"
              onclick={openAddStateModal}
              disabled={!formCountryCuid}
              title={!formCountryCuid ? "Select a country first" : "Add New State"}
            >
              <span class="font-bold text-lg text-muted-foreground group-hover:text-foreground transition-colors">+</span>
            </Button>
          </div>
          {#if stateError}<p class="text-xs text-destructive mt-1">{stateError}</p>{/if}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="city" class="font-medium">City <span class="text-destructive">*</span></Label>
          <Input id="city" name="city" bind:value={formCity} placeholder="e.g. Manhattan" class={cityError ? 'border-destructive focus-visible:ring-destructive' : ''} />
          {#if cityError}<p class="text-xs text-destructive mt-1">{cityError}</p>{/if}
        </div>
        <div class="space-y-2">
          <Label for="pin_code" class="font-medium">Pin Code / Zip <span class="text-destructive">*</span></Label>
          <Input id="pin_code" name="pin_code" bind:value={formPinCode} placeholder="e.g. 10001" class={pinCodeError ? 'border-destructive focus-visible:ring-destructive' : ''} />
          {#if pinCodeError}<p class="text-xs text-destructive mt-1">{pinCodeError}</p>{/if}
        </div>
      </div>
      {#if editLocation}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusDropdown id="loc_status" name="loc_status" value={formStatus} onChange={(val) => (formStatus = val)} />
        </div>
      {/if}
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
        <Button type="button" variant="outline" onclick={cancel} disabled={formLoading}>{UI_CONSTANTS.BUTTON_CANCEL}</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={formLoading || !isCreateEnabled || (!!editLocation && !isDirty)}>
          {formLoading ? UI_CONSTANTS.BUTTON_SAVING : editLocation ? UI_CONSTANTS.BUTTON_UPDATE : UI_CONSTANTS.BUTTON_SAVE}
        </Button>
      </div>
    </form>
  {/snippet}
</CrudModal>

<ConfirmModal
  open={showConfirmClose}
  title="Unsaved Changes"
  description="You have unsaved changes. Are you sure you want to close this modal?"
  confirmLabel="Cancel"
  cancelLabel="Keep Editing"
  variant="destructive"
  onConfirm={() => {
    showConfirmClose = false;
    open = false;
    $globalIsDirty = false;
  }}
  onCancel={() => {
    showConfirmClose = false;
  }}
/>

<!-- Mini modal for adding a new Country -->
{#if showAddCountry}
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
  <div class="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg border border-border">
    <h3 class="mb-4 text-lg font-semibold text-foreground">Add New Country</h3>
    <form onsubmit={handleAddCountrySubmit} class="space-y-4">
      <div class="space-y-2">
        <Label for="new_country_name">Country Name <span class="text-destructive">*</span></Label>
        <Input id="new_country_name" name="new_country_name" bind:value={newCountryName} placeholder="e.g. United States" class={addCountryError ? 'border-destructive focus-visible:ring-destructive' : ''} />
        {#if addCountryError}<p class="text-xs text-destructive mt-1">{addCountryError}</p>{/if}
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onclick={() => (showAddCountry = false)} disabled={addCountryLoading}>Cancel</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={addCountryLoading || newCountryName.trim() === ''}>{addCountryLoading ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  </div>
</div>
{/if}

<!-- Mini modal for adding a new State -->
{#if showAddState}
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
  <div class="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg border border-border">
    <h3 class="mb-4 text-lg font-semibold text-foreground">Add New State</h3>
    <p class="text-sm text-muted-foreground mb-4">Adding state to {countries.find((c) => c.cuid === formCountryCuid)?.name || 'selected country'}</p>
    <form onsubmit={handleAddStateSubmit} class="space-y-4">
      <div class="space-y-2">
        <Label for="new_state_name">State/Province Name <span class="text-destructive">*</span></Label>
        <Input id="new_state_name" name="new_state_name" bind:value={newStateName} placeholder="e.g. New York" class={addStateError ? 'border-destructive focus-visible:ring-destructive' : ''} />
        {#if addStateError}<p class="text-xs text-destructive mt-1">{addStateError}</p>{/if}
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onclick={() => (showAddState = false)} disabled={addStateLoading}>Cancel</Button>
        <Button type="submit" class="bg-[#F45310] text-white hover:bg-[#F45310]/90" disabled={addStateLoading || newStateName.trim() === ''}>{addStateLoading ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  </div>
</div>
{/if}
