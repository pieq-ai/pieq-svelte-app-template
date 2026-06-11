// src/lib/types/role.ts
export interface Role {
  cuid: string;
  role_name: string;
  status: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface RoleCreateDTO {
  role_name: string;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface RoleUpdateDTO {
  role_name?: string;
  status?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}
