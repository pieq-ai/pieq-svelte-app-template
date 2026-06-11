// src/lib/types/shift.ts
export interface Shift {
  cuid: string;
  shift_name: string;
  start_time: Date | string;
  end_time: Date | string;
  minimum_work_hours: number;
  status: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ShiftCreateDTO {
  shift_name: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ShiftUpdateDTO {
  shift_name?: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}
