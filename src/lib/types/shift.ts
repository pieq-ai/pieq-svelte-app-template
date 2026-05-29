// src/lib/types/shift.ts
export interface Shift {
  cuid: string;
  shift_name: string;
  start_time: Date | string;
  end_time: Date | string;
  minimum_work_hours: number;
  status: boolean;
}

export interface ShiftCreateDTO {
  shift_name: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number;
}

export interface ShiftUpdateDTO {
  shift_name?: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number;
  status?: boolean;
}
