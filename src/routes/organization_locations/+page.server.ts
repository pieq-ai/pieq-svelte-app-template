import * as locationService from '$lib/server/services/organization_location.service.js';
import * as masterDataService from '$lib/server/services/master-data.service.js';
import { mapLocation, mapCountry, mapState } from '$lib/server/response.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// 1. Fetch Locations
	const locationResult = await locationService.listAllLocations();
	const locations = (locationResult.data ?? []).map(mapLocation);

	// 2. Fetch/Seed Countries via Service
	const listCountries = await masterDataService.getCountries();
	const countries = listCountries
		.map(mapCountry)
		.sort((a, b) => a.name.localeCompare(b.name));

	// 3. Fetch/Seed States via Service
	const listStates = await masterDataService.getStates();
	const states = listStates
		.map(mapState)
		.sort((a, b) => a.name.localeCompare(b.name));

	return {
		locations,
		countries,
		states
	};
};
