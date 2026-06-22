// src/lib/types/shift.ts
export interface Shift {
  cuid: string;
  name: string;
  start_time: Date | string;
  end_time: Date | string;
  minimum_work_hours: number;
  status: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ShiftCreateDTO {
  name: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ShiftUpdateDTO {
  name?: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}
