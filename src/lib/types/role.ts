// src/lib/types/role.ts
export interface Role {
  cuid: string;
  name: string;
  status: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface RoleCreateDTO {
  name: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface RoleUpdateDTO {
  name?: string;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}
