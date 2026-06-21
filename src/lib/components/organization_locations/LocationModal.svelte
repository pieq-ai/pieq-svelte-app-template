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

  // Google Maps state variables
  let isMapApiLoaded = $state(false);
  let mapApiLoadError = $state("");
  let searchInput = $state<HTMLInputElement | null>(null);
  let mapContainer = $state<HTMLDivElement | null>(null);

  let map: any = null;
  let marker: any = null;
  let autocomplete: any = null;

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

  // Load Google Maps Script dynamically
  function loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return;
      const win = window as any;
      if (win.google?.maps) {
        isMapApiLoaded = true;
        resolve();
        return;
      }
      
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        let checkInterval = setInterval(() => {
          if (win.google?.maps) {
            clearInterval(checkInterval);
            isMapApiLoaded = true;
            resolve();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isMapApiLoaded = true;
        resolve();
      };
      script.onerror = (err) => {
        mapApiLoadError = "Failed to load Google Maps API script.";
        reject(err);
      };
      document.head.appendChild(script);
    });
  }

  // Country and State fuzzy matchers
  function findCountryCuid(gCountryName: string, gCountryShortName?: string): string {
    const cleanName = gCountryName.toLowerCase().trim();
    const cleanShort = gCountryShortName?.toLowerCase().trim();
    
    let match = countries.find(c => c.name.toLowerCase().trim() === cleanName);
    if (match) return match.cuid;
    
    if (cleanShort) {
      match = countries.find(c => c.name.toLowerCase().trim() === cleanShort);
      if (match) return match.cuid;
    }

    match = countries.find(c => c.name.toLowerCase().includes(cleanName) || cleanName.includes(c.name.toLowerCase()));
    if (match) return match.cuid;

    return '';
  }

  function findStateCuid(gStateName: string, gStateShortName: string, countryCuid: string): string {
    const cleanName = gStateName.toLowerCase().trim();
    const cleanShort = gStateShortName?.toLowerCase().trim();
    
    const countryStates = states.filter(s => s.country_cuid === countryCuid);
    
    let match = countryStates.find(s => s.name.toLowerCase().trim() === cleanName);
    if (match) return match.cuid;
    
    if (cleanShort) {
      match = countryStates.find(s => s.name.toLowerCase().trim() === cleanShort);
      if (match) return match.cuid;
    }

    match = countryStates.find(s => s.name.toLowerCase().includes(cleanName) || cleanName.includes(s.name.toLowerCase()));
    if (match) return match.cuid;

    return '';
  }

  // Populate address components from selected place
  function populateAddressFromPlace(place: any) {
    let streetNumber = '';
    let route = '';
    let sublocality = '';
    let city = '';
    let stateName = '';
    let stateShortName = '';
    let countryName = '';
    let countryShortName = '';
    let postalCode = '';

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        } else if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
          sublocality = component.long_name;
        } else if (types.includes('locality') || types.includes('postal_town')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !city) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          stateName = component.long_name;
          stateShortName = component.short_name;
        } else if (types.includes('country')) {
          countryName = component.long_name;
          countryShortName = component.short_name;
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      }
    }

    // Set Form values
    formName = place.name || place.formatted_address || '';
    
    const addr1 = [streetNumber, route].filter(Boolean).join(' ');
    formAddress1 = addr1 || place.name || place.formatted_address || '';
    
    formAddress2 = sublocality || '';
    formCity = city || '';
    formPinCode = postalCode || '';

    // Match Country & State
    if (countryName) {
      const matchedCountryCuid = findCountryCuid(countryName, countryShortName);
      if (matchedCountryCuid) {
        formCountryCuid = matchedCountryCuid;
        countryError = '';
        
        if (stateName) {
          const matchedStateCuid = findStateCuid(stateName, stateShortName, matchedCountryCuid);
          if (matchedStateCuid) {
            formStateCuid = matchedStateCuid;
            stateError = '';
          } else {
            formStateCuid = '';
            toast.warning(`State "${stateName}" not found in database. Please select it manually.`);
          }
        } else {
          formStateCuid = '';
        }
      } else {
        formCountryCuid = '';
        formStateCuid = '';
        toast.warning(`Country "${countryName}" not found in database. Please select it manually.`);
      }
    } else {
      toast.warning("Could not identify country from search. Please select it manually.");
    }
  }

  // Reverse geocode coordinate to address components
  function reverseGeocode(lat: number, lng: number) {
    const win = window as any;
    if (!win.google?.maps) return;
    const geocoder = new win.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
      if (status === 'OK' && results && results[0]) {
        populateAddressFromPlace(results[0]);
      } else {
        console.error('Reverse geocoding failed:', status);
        toast.error('Could not retrieve address components for this coordinate.');
      }
    });
  }

  // Initialize Map
  function initMap() {
    if (!mapContainer || !(window as any).google?.maps) return;
    const win = window as any;

    let defaultLat = 12.9716;
    let defaultLng = 77.5946;
    let defaultZoom = 12;

    const setupMap = (latVal: number, lngVal: number, zoomVal: number) => {
      const mapOptions = {
        center: { lat: latVal, lng: lngVal },
        zoom: zoomVal,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      };

      map = new win.google.maps.Map(mapContainer, mapOptions);

      marker = new win.google.maps.Marker({
        position: { lat: latVal, lng: lngVal },
        map,
        draggable: true,
        animation: win.google.maps.Animation.DROP
      });

      marker.addListener('dragend', () => {
        const position = marker?.getPosition();
        if (position) {
          const newLat = position.lat().toFixed(8);
          const newLng = position.lng().toFixed(8);
          formLatitude = newLat;
          formLongitude = newLng;
          
          reverseGeocode(position.lat(), position.lng());
        }
      });

      if (searchInput) {
        autocomplete = new win.google.maps.places.Autocomplete(searchInput, {
          fields: ['address_components', 'geometry', 'formatted_address', 'name']
        });

        autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete?.getPlace();
          if (!place || !place.geometry || !place.geometry.location) {
            toast.error("Location details not found for selected search. Please search again.");
            return;
          }

          const loc = place.geometry.location;
          map?.setCenter(loc);
          map?.setZoom(16);
          marker?.setPosition(loc);

          formLatitude = loc.lat().toFixed(8);
          formLongitude = loc.lng().toFixed(8);

          populateAddressFromPlace(place);
        });
      }
    };

    // Determine initial coordinates
    const hasCoords = formLatitude && formLongitude && !isNaN(parseFloat(formLatitude)) && !isNaN(parseFloat(formLongitude));
    if (hasCoords) {
      const lat = parseFloat(formLatitude);
      const lng = parseFloat(formLongitude);
      setupMap(lat, lng, 15);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            formLatitude = lat.toFixed(8);
            formLongitude = lng.toFixed(8);
            setupMap(lat, lng, 15);
            reverseGeocode(lat, lng);
          },
          (error) => {
            console.warn("Geolocation failed or denied, using default fallback:", error);
            setupMap(defaultLat, defaultLng, defaultZoom);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        setupMap(defaultLat, defaultLng, defaultZoom);
      }
    }
  }

  // Effect hook to load/init map when modal opens
  $effect(() => {
    if (open) {
      setTimeout(() => {
        loadGoogleMapsScript().then(initMap).catch(err => {
          console.error("Maps load error:", err);
        });
      }, 50);
    } else {
      map = null;
      marker = null;
      autocomplete = null;
    }
  });

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
      <!-- Google Maps Integration -->
      <div class="space-y-2">
        <Label for="map_search">Search Location on Google Maps</Label>
        <Input
          id="map_search"
          name="map_search"
          bind:ref={searchInput}
          placeholder="Type a location name or address..."
        />
      </div>

      <div class="space-y-2">
        <div 
          bind:this={mapContainer} 
          class="w-full h-[250px] rounded-md border border-input bg-muted/20 relative"
          id="google-map-container"
        >
          {#if !isMapApiLoaded && !mapApiLoadError}
            <div class="absolute inset-0 flex items-center justify-center bg-background/50">
              <LoaderCircleIcon class="size-6 animate-spin text-muted-foreground" />
            </div>
          {/if}
          {#if mapApiLoadError}
            <div class="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/50 text-center">
              <p class="text-sm text-destructive font-medium">{mapApiLoadError}</p>
              <Button size="sm" variant="outline" class="mt-2" onclick={() => loadGoogleMapsScript().then(initMap)}>Retry</Button>
            </div>
          {/if}
        </div>
        <p class="text-[11px] text-muted-foreground">
          Tip: Search for a location above or drag the marker on the map to fine-tune the position.
        </p>
      </div>

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

<ConfirmModal
  open={showConfirmClose}
  title="Unsaved Changes"
  description="You have unsaved changes. Are you sure you want to close this modal?"
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
