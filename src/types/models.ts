// src/types/models.ts
export interface Module {
  id: number;
  name: string;
  code: string;
  applicationType: number;
}

export interface Page {
  id: number;
  moduleId: number;
  name: string;
  code: string;
  url: string;
}

export interface Operation {
  id: number;
  pageId: number;
  code: string;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  status: number;
  isTemplate?: boolean;
}

export interface RolePermission {
  id: number;
  roleId: number;
  pageId: number | null;
  moduleId: number | null;
  operationId: number | null;
}

export interface UserRole {
  roleId: number;
  userId: number;
}

export interface User {
  id: number;
  name?: string;
}

// Composite types for the UI
export interface PageWithOperations extends Page {
  operations: Operation[];
}

export interface ModuleWithPages extends Module {
  pages: PageWithOperations[];
}

export interface RoleDetail extends Role {
  permissions: RolePermission[];
  userCount: number;
}

// Permission selection state for UI
export interface PermissionSelection {
  modules: Record<number, boolean>;
  pages: Record<number, boolean>;
  operations: Record<number, boolean>;
}