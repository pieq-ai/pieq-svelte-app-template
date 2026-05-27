// src/lib/types/role.ts
export interface Role {
  role_id: number;
  uuid: string;
  name: string;
  is_active: boolean;
}

export interface RoleCreateDTO {
  name: string;
}

export interface RoleUpdateDTO {
  name?: string;
}
