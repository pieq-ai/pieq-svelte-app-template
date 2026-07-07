// src/lib/types/shift-assignment.ts

export interface ShiftAssignment {
  cuid: string;
  employee_cuid: string;
  shift_cuid: string;
  effective_from: Date | string;
  effective_to: Date | string | null;
  status: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  created_by?: string | null;
  updated_by?: string | null;
  // Included fields for convenience/display in the table
  employee?: {
    first_name: string;
    last_name: string;
    emp_code: string;
  };
  shift?: {
    name: string;
    start_time: Date | string;
    end_time: Date | string;
    minimum_work_hours?: number;
  };
}

export interface ShiftAssignmentCreateDTO {
  employee_cuid: string;
  shift_cuid: string;
  effective_from: Date | string;
  effective_to?: Date | string | null;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ShiftAssignmentUpdateDTO {
  employee_cuid?: string;
  shift_cuid?: string;
  effective_from?: Date | string;
  effective_to?: Date | string | null;
  status?: boolean;
  updated_by?: string | null;
}
