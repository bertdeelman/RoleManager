// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Module, 
  Page, 
  Operation, 
  Role, 
  RolePermission, 
  ModuleWithPages
} from '../types/models';
import * as dbService from '../services/db';
import { checkAndMigrateData } from '../services/dataMigration';

interface AppContextType {
  modules: Module[];
  pages: Page[];
  operations: Operation[];
  roles: Role[];
  rolePermissions: RolePermission[];
  hierarchy: ModuleWithPages[];
  loading: boolean;
  error: string | null;
  
  // Role management functions
  getRoleById: (id: number) => Role | undefined;
  getPermissionsForRole: (roleId: number) => RolePermission[];
  getPermissionCountForRole: (roleId: number) => number;
  
  // Database operations
  createRole: (role: Omit<Role, 'id'>) => Promise<number>;
  updateRole: (role: Role) => Promise<void>;
  cloneRole: (sourceRoleId: number, newRoleName: string) => Promise<number>;
  addRolePermission: (permission: Omit<RolePermission, 'id'>) => Promise<number>;
  deleteRolePermission: (id: number) => Promise<void>;
  updateRolePermissions: (
    roleId: number, 
    selectedModules: Record<number, boolean>,
    selectedPages: Record<number, boolean>,
    selectedOperations: Record<number, boolean>
  ) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [hierarchy, setHierarchy] = useState<ModuleWithPages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  
  // Initialize database
  useEffect(() => {
    const initDb = async () => {
      try {
        await dbService.initializeDatabase();
        await checkAndMigrateData();
        setDbInitialized(true);
      } catch (err) {
        console.error('Database initialization error:', err);
        setError('Failed to initialize database');
        setLoading(false);
      }
    };
    
    initDb();
  }, []);
  
  // Load data from database
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [loadedModules, loadedPages, loadedOperations, loadedRoles, loadedHierarchy] = await Promise.all([
        dbService.getModules(),
        dbService.getPages(),
        dbService.getOperations(),
        dbService.getRoles(),
        dbService.getHierarchy()
      ]);
      
      setModules(loadedModules);
      setPages(loadedPages);
      setOperations(loadedOperations);
      setRoles(loadedRoles);
      setHierarchy(loadedHierarchy);
      
      // Load all role permissions for all roles
      const allPermissions: RolePermission[] = [];
      for (const role of loadedRoles) {
        const rolePerms = await dbService.getRolePermissions(role.id);
        allPermissions.push(...rolePerms);
      }
      setRolePermissions(allPermissions);
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };
  
  // Load data once database is initialized
  useEffect(() => {
    if (dbInitialized) {
      loadData();
    }
  }, [dbInitialized]);
  
  // Helper functions
  const getRoleById = (id: number) => roles.find(role => role.id === id);
  
  const getPermissionsForRole = (roleId: number) => 
    rolePermissions.filter(perm => perm.roleId === roleId);
  
  const getPermissionCountForRole = (roleId: number) => 
    rolePermissions.filter(perm => perm.roleId === roleId).length;
  
  // Database operations with state updates
  const createRole = async (roleData: Omit<Role, 'id'>): Promise<number> => {
    const newRoleId = await dbService.createRole(roleData);
    await refreshData(); // Reload data to reflect changes
    return newRoleId;
  };
  
  const updateRole = async (roleData: Role): Promise<void> => {
    await dbService.updateRole(roleData);
    await refreshData();
  };
  
  const cloneRole = async (sourceRoleId: number, newRoleName: string): Promise<number> => {
    const newRoleId = await dbService.cloneRole(sourceRoleId, newRoleName);
    await refreshData();
    return newRoleId;
  };
  
  const addRolePermission = async (permission: Omit<RolePermission, 'id'>): Promise<number> => {
    const permId = await dbService.addRolePermission(permission);
    await refreshData();
    return permId;
  };
  
  const deleteRolePermission = async (id: number): Promise<void> => {
    await dbService.deleteRolePermission(id);
    await refreshData();
  };
  
  const updateRolePermissions = async (
    roleId: number, 
    selectedModules: Record<number, boolean>,
    selectedPages: Record<number, boolean>,
    selectedOperations: Record<number, boolean>
  ): Promise<void> => {
    await dbService.updateRolePermissions(roleId, selectedModules, selectedPages, selectedOperations);
    await refreshData();
  };
  
  const refreshData = async (): Promise<void> => {
    await loadData();
  };
  
  const value = {
    modules,
    pages,
    operations,
    roles,
    rolePermissions,
    hierarchy,
    loading,
    error,
    getRoleById,
    getPermissionsForRole,
    getPermissionCountForRole,
    createRole,
    updateRole,
    cloneRole,
    addRolePermission,
    deleteRolePermission,
    updateRolePermissions,
    refreshData
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