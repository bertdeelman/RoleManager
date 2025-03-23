// src/services/db.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Role, RolePermission, Module, Page, Operation } from '../types/models';

let db: Database | null = null;

export async function initializeDatabase() {
  if (db) return db;
  
  db = await open({
    filename: './rolemanager.db',
    driver: sqlite3.Database
  });
  
  await setupDatabase();
  return db;
}

async function setupDatabase() {
  await db?.exec(`
    CREATE TABLE IF NOT EXISTS MODULES (
      ModuleID INTEGER PRIMARY KEY,
      ModuleName TEXT NOT NULL,
      ModuleCode TEXT NOT NULL,
      ApplicationType INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS PAGES (
      PageID INTEGER PRIMARY KEY,
      ModuleID INTEGER NOT NULL,
      PageName TEXT NOT NULL,
      PageCode TEXT NOT NULL,
      PageURL TEXT,
      FOREIGN KEY (ModuleID) REFERENCES MODULES(ModuleID)
    );
    
    CREATE TABLE IF NOT EXISTS OPERATIONS (
      OperationID INTEGER PRIMARY KEY,
      PageID INTEGER NOT NULL,
      OperationCode TEXT NOT NULL,
      OperationName TEXT NOT NULL,
      FOREIGN KEY (PageID) REFERENCES PAGES(PageID)
    );
    
    CREATE TABLE IF NOT EXISTS ROLES (
      RoleID INTEGER PRIMARY KEY,
      RoleName TEXT NOT NULL UNIQUE,
      Status INTEGER NOT NULL,
      IsTemplate INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS ROLEPERMISSIONS (
      RolePermissionID INTEGER PRIMARY KEY,
      RoleID INTEGER NOT NULL,
      PageID INTEGER,
      ModuleID INTEGER,
      OperationID INTEGER,
      FOREIGN KEY (RoleID) REFERENCES ROLES(RoleID),
      FOREIGN KEY (PageID) REFERENCES PAGES(PageID),
      FOREIGN KEY (ModuleID) REFERENCES MODULES(ModuleID),
      FOREIGN KEY (OperationID) REFERENCES OPERATIONS(OperationID)
    );
  `);
}

// Role operations
export async function getRoles(): Promise<Role[]> {
  return db?.all('SELECT RoleID as id, RoleName as name, Status as status, IsTemplate as isTemplate FROM ROLES') || [];
}

export async function getRoleById(id: number): Promise<Role | undefined> {
  return db?.get('SELECT RoleID as id, RoleName as name, Status as status, IsTemplate as isTemplate FROM ROLES WHERE RoleID = ?', id);
}

export async function createRole(role: Omit<Role, 'id'>): Promise<number> {
  const result = await db?.run(
    'INSERT INTO ROLES (RoleName, Status, IsTemplate) VALUES (?, ?, ?)',
    role.name, role.status, role.isTemplate ? 1 : 0
  );
  return result?.lastID || 0;
}

export async function updateRole(role: Role): Promise<void> {
  await db?.run(
    'UPDATE ROLES SET RoleName = ?, Status = ?, IsTemplate = ? WHERE RoleID = ?',
    role.name, role.status, role.isTemplate ? 1 : 0, role.id
  );
}

// Role permission operations
export async function getRolePermissions(roleId: number): Promise<RolePermission[]> {
  return db?.all(`
    SELECT 
      RolePermissionID as id, 
      RoleID as roleId, 
      PageID as pageId, 
      ModuleID as moduleId, 
      OperationID as operationId 
    FROM ROLEPERMISSIONS 
    WHERE RoleID = ?
  `, roleId) || [];
}

export async function addRolePermission(permission: Omit<RolePermission, 'id'>): Promise<number> {
  const result = await db?.run(
    'INSERT INTO ROLEPERMISSIONS (RoleID, PageID, ModuleID, OperationID) VALUES (?, ?, ?, ?)',
    permission.roleId, permission.pageId, permission.moduleId, permission.operationId
  );
  return result?.lastID || 0;
}

export async function deleteRolePermission(id: number): Promise<void> {
  await db?.run('DELETE FROM ROLEPERMISSIONS WHERE RolePermissionID = ?', id);
}

// Clone role with permissions
export async function cloneRole(sourceRoleId: number, newRoleName: string): Promise<number> {
  const sourceRole = await getRoleById(sourceRoleId);
  if (!sourceRole) throw new Error(`Role with ID ${sourceRoleId} not found`);
  
  await db?.exec('BEGIN TRANSACTION');
  try {
    // Create new role
    const newRoleId = await createRole({
      name: newRoleName,
      status: sourceRole.status,
      isTemplate: false
    });
    
    // Copy permissions
    const permissions = await getRolePermissions(sourceRoleId);
    for (const perm of permissions) {
      await addRolePermission({
        roleId: newRoleId,
        pageId: perm.pageId,
        moduleId: perm.moduleId,
        operationId: perm.operationId
      });
    }
    
    await db?.exec('COMMIT');
    return newRoleId;
  } catch (error) {
    await db?.exec('ROLLBACK');
    throw error;
  }
}

// Module, Page, and Operation operations (needed for UI)
export async function getModules(): Promise<Module[]> {
  return db?.all('SELECT ModuleID as id, ModuleName as name, ModuleCode as code, ApplicationType as applicationType FROM MODULES') || [];
}

export async function getPages(): Promise<Page[]> {
  return db?.all('SELECT PageID as id, ModuleID as moduleId, PageName as name, PageCode as code, PageURL as url FROM PAGES') || [];
}

export async function getOperations(): Promise<Operation[]> {
  return db?.all('SELECT OperationID as id, PageID as pageId, OperationCode as code, OperationName as name FROM OPERATIONS') || [];
}

// Get hierarchical structure for UI
export async function getHierarchy() {
  const modules = await getModules();
  const pages = await getPages();
  const operations = await getOperations();
  
  return modules.map(module => {
    const modulePages = pages.filter(page => page.moduleId === module.id);
    
    const pagesWithOperations = modulePages.map(page => {
      const pageOperations = operations.filter(op => op.pageId === page.id);
      return {
        ...page,
        operations: pageOperations
      };
    });
    
    return {
      ...module,
      pages: pagesWithOperations
    };
  });
}

// Update permissions batch operation
export async function updateRolePermissions(
  roleId: number, 
  selectedModules: Record<number, boolean>,
  selectedPages: Record<number, boolean>,
  selectedOperations: Record<number, boolean>
): Promise<void> {
  await db?.exec('BEGIN TRANSACTION');
  
  try {
    // Get existing permissions
    const existingPermissions = await getRolePermissions(roleId);
    
    // Process module permissions
    for (const [moduleIdStr, selected] of Object.entries(selectedModules)) {
      const moduleId = parseInt(moduleIdStr, 10);
      const existingPerm = existingPermissions.find(
        p => p.moduleId === moduleId && p.pageId === null && p.operationId === null
      );
      
      if (selected && !existingPerm) {
        // Add permission
        await addRolePermission({
          roleId,
          moduleId,
          pageId: null,
          operationId: null
        });
      } else if (!selected && existingPerm) {
        // Remove permission
        await deleteRolePermission(existingPerm.id);
      }
    }
    
    // Process page permissions
    for (const [pageIdStr, selected] of Object.entries(selectedPages)) {
      const pageId = parseInt(pageIdStr, 10);
      const existingPerm = existingPermissions.find(
        p => p.pageId === pageId && p.operationId === null
      );
      
      if (selected && !existingPerm) {
        // Add permission
        await addRolePermission({
          roleId,
          moduleId: null,
          pageId,
          operationId: null
        });
      } else if (!selected && existingPerm) {
        // Remove permission
        await deleteRolePermission(existingPerm.id);
      }
    }
    
    // Process operation permissions
    for (const [operationIdStr, selected] of Object.entries(selectedOperations)) {
      const operationId = parseInt(operationIdStr, 10);
      const existingPerm = existingPermissions.find(
        p => p.operationId === operationId
      );
      
      if (selected && !existingPerm) {
        // Add permission
        await addRolePermission({
          roleId,
          moduleId: null,
          pageId: null,
          operationId
        });
      } else if (!selected && existingPerm) {
        // Remove permission
        await deleteRolePermission(existingPerm.id);
      }
    }
    
    await db?.exec('COMMIT');
  } catch (error) {
    await db?.exec('ROLLBACK');
    throw error;
  }
}