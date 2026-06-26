import { describe, it, expect } from 'vitest';
import type { CompanyLocation } from '../../src/lib/types/organization_location';

// The exact client-side filtering logic from src/routes/organization_locations/+page.svelte
function runLocationFilters(
  locations: CompanyLocation[],
  filterStatus: 'all' | 'active' | 'inactive',
  filterCountry: string,
  filterState: string,
  searchQuery: string,
  countries: Array<{ cuid: string; name: string }>,
  states: Array<{ cuid: string; name: string; country_cuid: string }>
): CompanyLocation[] {
  let list = locations;

  // Status Filter
  if (filterStatus === 'active') {
    list = locations.filter((loc) => loc.status);
  } else if (filterStatus === 'inactive') {
    list = locations.filter((loc) => !loc.status);
  }

  // Country Filter
  if (filterCountry !== 'all') {
    list = list.filter((loc) => loc.country_cuid === filterCountry);
  }

  // State Filter
  if (filterState !== 'all') {
    list = list.filter((loc) => loc.state_cuid === filterState);
  }

  // Search Filter
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    const getCountryName = (cuid: string) => countries.find(c => c.cuid === cuid)?.name ?? cuid;
    const getStateName = (cuid: string) => states.find(s => s.cuid === cuid)?.name ?? cuid;

    list = list.filter((loc) => {
      const locName = (loc.name ?? '').toLowerCase();
      const city = (loc.city ?? '').toLowerCase();
      const stateName = getStateName(loc.state_cuid ?? '').toLowerCase();
      const countryName = getCountryName(loc.country_cuid ?? '').toLowerCase();
      const pinCode = (loc.pin_code ?? '').toLowerCase();

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
}

// Client-side sorting logic
function runLocationSorting(
  locations: CompanyLocation[],
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc' | null
): CompanyLocation[] {
  let list = [...locations];
  if (sortColumn && sortDirection) {
    list.sort((a, b) => {
      let valA = a[sortColumn as keyof typeof a];
      let valB = b[sortColumn as keyof typeof b];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const comp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? comp : -comp;
      }
      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        const numA = valA ? 1 : 0;
        const numB = valB ? 1 : 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      if (valA! < valB!) return sortDirection === 'asc' ? -1 : 1;
      if (valA! > valB!) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  return list;
}

describe('Company Locations Client-side Filtering & Sorting Tests', () => {
  const mockCountries = [
    { cuid: 'country-usa', name: 'United States' },
    { cuid: 'country-can', name: 'Canada' }
  ];

  const mockStates = [
    { cuid: 'state-ny', name: 'New York', country_cuid: 'country-usa' },
    { cuid: 'state-ca', name: 'California', country_cuid: 'country-usa' },
    { cuid: 'state-on', name: 'Ontario', country_cuid: 'country-can' }
  ];

  const mockLocations: CompanyLocation[] = [
    {
      cuid: 'loc-1',
      name: 'HQ New York',
      address_line1: '123 Wall St',
      city: 'NYC',
      state_cuid: 'state-ny',
      country_cuid: 'country-usa',
      pin_code: '10005',
      timezone: 'EST',
      status: true
    },
    {
      cuid: 'loc-2',
      name: 'Silicon Valley Office',
      address_line1: '456 Sand Hill Rd',
      city: 'Palo Alto',
      state_cuid: 'state-ca',
      country_cuid: 'country-usa',
      pin_code: '94301',
      timezone: 'PST',
      status: true
    },
    {
      cuid: 'loc-3',
      name: 'Toronto Branch',
      address_line1: '789 Yonge St',
      city: 'Toronto',
      state_cuid: 'state-on',
      country_cuid: 'country-can',
      pin_code: 'M4Y 1Z9',
      timezone: 'EST',
      status: false
    }
  ];

  it('should support Country-only filtering', () => {
    const filtered = runLocationFilters(mockLocations, 'all', 'country-usa', 'all', '', mockCountries, mockStates);
    expect(filtered.length).toBe(2);
    expect(filtered.every((l) => l.country_cuid === 'country-usa')).toBe(true);
  });

  it('should support State-only filtering', () => {
    const filtered = runLocationFilters(mockLocations, 'all', 'all', 'state-ca', '', mockCountries, mockStates);
    expect(filtered.length).toBe(1);
    expect(filtered[0].cuid).toBe('loc-2');
  });

  it('should support Country + State filtering together', () => {
    const filtered = runLocationFilters(mockLocations, 'all', 'country-usa', 'state-ny', '', mockCountries, mockStates);
    expect(filtered.length).toBe(1);
    expect(filtered[0].cuid).toBe('loc-1');
  });

  it('should work alongside existing status filters', () => {
    const activeUsa = runLocationFilters(mockLocations, 'active', 'country-usa', 'all', '', mockCountries, mockStates);
    expect(activeUsa.length).toBe(2);

    const inactiveCan = runLocationFilters(mockLocations, 'inactive', 'country-can', 'all', '', mockCountries, mockStates);
    expect(inactiveCan.length).toBe(1);
    expect(inactiveCan[0].cuid).toBe('loc-3');
  });

  it('should work alongside search filters', () => {
    const searchRes = runLocationFilters(mockLocations, 'all', 'country-usa', 'all', 'Valley', mockCountries, mockStates);
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].cuid).toBe('loc-2');
  });

  it('should work alongside client-side sorting', () => {
    const filtered = runLocationFilters(mockLocations, 'all', 'country-usa', 'all', '', mockCountries, mockStates);
    const sorted = runLocationSorting(filtered, 'name', 'desc');
    expect(sorted.length).toBe(2);
    expect(sorted[0].cuid).toBe('loc-2'); // "Silicon Valley Office" before "HQ New York" in descending sort
  });

  it('should work alongside pagination slicing', () => {
    const filtered = runLocationFilters(mockLocations, 'all', 'all', 'all', '', mockCountries, mockStates);
    // Page 1, Limit 2
    const page1 = filtered.slice(0, 2);
    expect(page1.length).toBe(2);
    expect(page1[0].cuid).toBe('loc-1');
    expect(page1[1].cuid).toBe('loc-2');

    // Page 2, Limit 2
    const page2 = filtered.slice(2, 4);
    expect(page2.length).toBe(1);
    expect(page2[0].cuid).toBe('loc-3');
  });
});
