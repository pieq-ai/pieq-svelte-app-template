// src/lib/types/role.ts
export interface Role {
  cuid: string;
  name: string;
  status: boolean;
}

export interface RoleCreateDTO {
  name: string;
}

export interface RoleUpdateDTO {
  name?: string;
  status?: boolean;
}
