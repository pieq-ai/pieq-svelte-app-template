// src/lib/types/shift.ts
export interface Shift {
  shift_id: number;
  shift_name: string;
  start_time: Date | string;
  end_time: Date | string;
  minimum_work_hours: number | string | any;
  status: boolean;
}

export interface ShiftCreateDTO {
  shift_name: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number | string | any;
}

export interface ShiftUpdateDTO {
  shift_name?: string;
  start_time?: Date | string;
  end_time?: Date | string;
  minimum_work_hours?: number | string | any;
  status?: boolean;
}
