// src/lib/types/organization_location.ts
export interface CompanyLocation {
  cuid: string;
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state_cuid: string;
  country_cuid: string;
  pin_code: string;
  timezone: string;
  status: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CompanyLocationCreateDTO {
  name: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state_cuid?: string;
  country_cuid?: string;
  pin_code?: string;
  timezone?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CompanyLocationUpdateDTO {
  name?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state_cuid?: string;
  country_cuid?: string;
  pin_code?: string;
  timezone?: string;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}
