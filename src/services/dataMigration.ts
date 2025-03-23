// src/services/dataMigration.ts
import { initializeDatabase } from './db';
import sqlData from '../data/sqlData';
import { SqlDataParser } from '../utils/dataParser';

export async function migrateStaticDataToDatabase() {
  const db = await initializeDatabase();
  const parser = new SqlDataParser(sqlData);
  
  const modules = parser.parseModules();
  const pages = parser.parsePages();
  const operations = parser.parseOperations();
  const roles = parser.parseRoles();
  const rolePermissions = parser.parseRolePermissions();
  
  // Start transaction
  await db.exec('BEGIN TRANSACTION');
  
  try {
    // Insert modules
    for (const module of modules) {
      await db.run(
        'INSERT OR IGNORE INTO MODULES (ModuleID, ModuleName, ModuleCode, ApplicationType) VALUES (?, ?, ?, ?)',
        module.id, module.name, module.code, module.applicationType
      );
    }
    
    // Insert pages
    for (const page of pages) {
      await db.run(
        'INSERT OR IGNORE INTO PAGES (PageID, ModuleID, PageName, PageCode, PageURL) VALUES (?, ?, ?, ?, ?)',
        page.id, page.moduleId, page.name, page.code, page.url
      );
    }
    
    // Insert operations
    for (const op of operations) {
      await db.run(
        'INSERT OR IGNORE INTO OPERATIONS (OperationID, PageID, OperationCode, OperationName) VALUES (?, ?, ?, ?)',
        op.id, op.pageId, op.code, op.name
      );
    }
    
    // Insert roles
    for (const role of roles) {
      await db.run(
        'INSERT OR IGNORE INTO ROLES (RoleID, RoleName, Status, IsTemplate) VALUES (?, ?, ?, ?)',
        role.id, role.name, role.status, role.isTemplate ? 1 : 0
      );
    }
    
    // Insert role permissions
    for (const perm of rolePermissions) {
      await db.run(
        'INSERT OR IGNORE INTO ROLEPERMISSIONS (RolePermissionID, RoleID, PageID, ModuleID, OperationID) VALUES (?, ?, ?, ?, ?)',
        perm.id, perm.roleId, perm.pageId, perm.moduleId, perm.operationId
      );
    }
    
    // Commit transaction
    await db.exec('COMMIT');
    console.log('Data migration completed successfully');
  } catch (error) {
    // Rollback on error
    await db.exec('ROLLBACK');
    console.error('Error during data migration:', error);
    throw error;
  }
}

// Check if the database is empty and needs initial data
export async function checkAndMigrateData() {
  const db = await initializeDatabase();
  
  try {
    // Check if ROLES table is empty
    const result = await db.get('SELECT COUNT(*) as count FROM ROLES');
    if (result.count === 0) {
      console.log('Database is empty, migrating static data...');
      await migrateStaticDataToDatabase();
    } else {
      console.log('Database already contains data, skipping migration');
    }
  } catch (error) {
    console.error('Error checking database:', error);
    // If there's an error (like the table doesn't exist), we should migrate
    await migrateStaticDataToDatabase();
  }
}