// src/lib/types/organization_location.ts
export interface CompanyLocation {
  cuid: string;
  location_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state_uuid: string;
  country_uuid: string;
  pin_code: string;
  timezone: string;
  is_active: boolean;
}

export interface CompanyLocationCreateDTO {
  location_name: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state_uuid?: string;
  country_uuid?: string;
  pin_code?: string;
  timezone?: string;
}

export interface CompanyLocationUpdateDTO {
  location_name?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state_uuid?: string;
  country_uuid?: string;
  pin_code?: string;
  timezone?: string;
  is_active?: boolean;
}
