// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Module, 
  Page, 
  Operation, 
  Role, 
  RolePermission, 
  UserRole,
  ModuleWithPages
} from '../types/models';
import { SqlDataParser } from '../utils/dataParser';
import sqlData from '../data/sqlData';

interface AppContextType {
  modules: Module[];
  pages: Page[];
  operations: Operation[];
  roles: Role[];
  rolePermissions: RolePermission[];
  userRoles: UserRole[];
  hierarchy: ModuleWithPages[];
  loading: boolean;
  error: string | null;
  
  // Role management functions
  getRoleById: (id: number) => Role | undefined;
  getPermissionsForRole: (roleId: number) => RolePermission[];
  getUserCountForRole: (roleId: number) => number;
  getPermissionCountForRole: (roleId: number) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [hierarchy, setHierarchy] = useState<ModuleWithPages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // In a real app, this might be an API call
      const parser = new SqlDataParser(sqlData);
      const data = parser.parseAll();
      
      setModules(data.modules);
      setPages(data.pages);
      setOperations(data.operations);
      setRoles(data.roles);
      setRolePermissions(data.rolePermissions);
      setUserRoles(data.userRoles);
      setHierarchy(data.hierarchy);
      setLoading(false);
    } catch (err) {
      setError('Failed to parse SQL data');
      setLoading(false);
      console.error(err);
    }
  }, []);
  
  // Helper functions for role management
  const getRoleById = (id: number) => roles.find(role => role.id === id);
  
  const getPermissionsForRole = (roleId: number) => 
    rolePermissions.filter(perm => perm.roleId === roleId);
  
  const getUserCountForRole = (roleId: number) => 
    userRoles.filter(userRole => userRole.roleId === roleId).length;
  
  const getPermissionCountForRole = (roleId: number) => 
    rolePermissions.filter(perm => perm.roleId === roleId).length;
  
  const value = {
    modules,
    pages,
    operations,
    roles,
    rolePermissions,
    userRoles,
    hierarchy,
    loading,
    error,
    getRoleById,
    getPermissionsForRole,
    getUserCountForRole,
    getPermissionCountForRole
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};