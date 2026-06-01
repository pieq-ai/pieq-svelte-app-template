// src/lib/server/response.ts
import { json } from '@sveltejs/kit';

export function sendList(data: any[]) {
  return json({ data });
}

export function sendSingle(data: any) {
  return json({ data });
}

export function sendCreated(entityName: string, cuid: string) {
  return json({
    data: {
      message: `${entityName} created successfully`,
      cuid
    }
  }, { status: 201 });
}

export function sendUpdated(entityName: string, cuid: string) {
  return json({
    data: {
      message: `${entityName} updated successfully`,
      cuid
    }
  }, { status: 200 });
}

export function sendDeleted(entityName: string, cuid: string) {
  return json({
    data: {
      message: `${entityName} deleted successfully`,
      cuid
    }
  }, { status: 200 });
}

// Field Mappers / DTOs to exclude internal metadata
export function mapRole(role: any) {
  return {
    cuid: role.cuid,
    name: role.name,
    status: role.status
  };
}

export function mapShift(shift: any) {
  return {
    cuid: shift.cuid,
    shift_name: shift.shift_name,
    start_time: shift.start_time,
    end_time: shift.end_time,
    minimum_work_hours: Number(shift.minimum_work_hours),
    status: shift.status
  };
}

export function mapLocation(loc: any) {
  return {
    cuid: loc.cuid,
    location_name: loc.location_name,
    address_line1: loc.address_line1,
    address_line2: loc.address_line2,
    city: loc.city,
    state_cuid: loc.state_cuid,
    country_cuid: loc.country_cuid,
    pin_code: loc.pin_code,
    timezone: loc.timezone,
    is_active: loc.is_active
  };
}

export function mapCountry(country: any) {
  return {
    cuid: country.cuid,
    country_name: country.country_name
  };
}

export function mapState(state: any) {
  return {
    cuid: state.cuid,
    state_name: state.state_name,
    country_cuid: state.country_cuid
  };
}
