// src/lib/types/organization_location.ts
export interface CompanyLocation {
  location_id: number;
  location_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state_id: number;
  country_id: number;
  pin_code: string;
  timezone: string;
  is_active: boolean;
}

export interface CompanyLocationCreateDTO {
  location_name: string;
}

export interface CompanyLocationUpdateDTO {
  location_name?: string;
  is_active?: boolean;
}
