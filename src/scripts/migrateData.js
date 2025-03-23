// scripts/migrateData.js
// ES Module version for package.json with "type": "module"
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your database file (in project root)
const DB_PATH = join(__dirname, '..', 'rolemanager.db');

// Open database connection 
function openDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Could not connect to database', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      resolve(db);
    });
  });
}

// Setup database tables
async function setupDatabase(db) {
  return new Promise((resolve, reject) => {
    const sql = `
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
    `;
    
    db.exec(sql, (err) => {
      if (err) {
        console.error('Error creating tables', err);
        reject(err);
        return;
      }
      console.log('Database tables created successfully');
      resolve();
    });
  });
}

// Sample data - this should represent your actual data structure
const sampleData = {
  modules: [
    { id: 1, name: 'Activity', code: '65BAA1AA-730E-4EF5-A61F-DE9D675F946C', applicationType: 0 },
    { id: 2, name: 'Goods receival', code: 'E6CA7A03-3C00-4453-8B6E-4D3E260EBB83', applicationType: 0 },
    { id: 5, name: 'Warehouse', code: '5379BADB-941A-4AB0-954D-F5F9278119E4', applicationType: 0 },
    { id: 12, name: 'System', code: '0000002F-0000-0000-C000-000000000046', applicationType: 0 }
  ],
  
  pages: [
    { id: 1, moduleId: 1, name: 'Activity page', code: '41046929-9BAB-4C6C-AA11-CC9863F88CF6', url: 'Default.aspx' },
    { id: 2, moduleId: 1, name: 'User activity', code: '186F635D-E28F-4FA2-8792-19F86FBC81CF', url: 'Pages/Activity/UserActivity/UserActivitySearch.aspx' },
    { id: 15, moduleId: 5, name: 'Product', code: 'DCA418BF-69F3-4671-8651-F0CC7C189B5C', url: 'Pages/Warehouse/SearchAndListProducts.aspx' },
    { id: 17, moduleId: 5, name: 'Locations', code: 'C45F1333-B9E6-478C-8635-B10A38B36FB3', url: 'Default.aspx?ServiceCode=PRDWS#ContentURL=loc' },
    { id: 48, moduleId: 12, name: 'Add/Edit users', code: '00000100-0000-0010-8000-00AA006D2EA4', url: 'Pages/System/AddEditUsers.aspx' },
    { id: 56, moduleId: 12, name: 'Users', code: 'A9BB6D11-D7A7-4FBC-8803-654E8FBDE1A2', url: 'Pages/System/SearchAndListUsers.aspx' },
    { id: 58, moduleId: 12, name: 'Roles', code: 'D128CF43-2745-4039-9810-F11C62FBE1E2', url: 'Pages/System/SearchAndListRoles.aspx' }
  ],
  
  operations: [
    { id: 1, pageId: 2, code: '0F6C6BDC-067E-4BBD-AB7D-2002F5EC3093', name: 'Cancel pick list action' },
    { id: 2, pageId: 2, code: 'EA34645B-6BE0-4CAD-9A4D-3C012B14431B', name: 'Cancel task group action' },
    { id: 57, pageId: 15, code: 'D7C828C7-FB62-4776-90E3-77AF91BF30A6', name: 'WarehouseProductHistoryAction' },
    { id: 58, pageId: 15, code: 'B83A4BDA-94E0-4425-9CF2-C9CF08415542', name: 'AddEditProductPage' },
    { id: 84, pageId: 48, code: 'F3D3F924-11FC-11D3-BB97-00C04F8EE6C0', name: 'Save' },
    { id: 85, pageId: 48, code: 'f414c260-6ac0-11cf-b6d1-00aa00bbbb58', name: 'Add' }
  ],
  
  roles: [
    { id: 1, name: 'eManagerAdministrator', status: 0, isTemplate: true },
    { id: 2, name: 'SuperUser', status: 0, isTemplate: true },
    { id: 22, name: 'User', status: 0, isTemplate: true }
  ],
  
  rolePermissions: [
    { id: 1, roleId: 2, pageId: null, moduleId: 1, operationId: null },
    { id: 21, roleId: 2, pageId: null, moduleId: 2, operationId: null },
    { id: 22, roleId: 2, pageId: null, moduleId: 5, operationId: null },
    { id: 26, roleId: 2, pageId: null, moduleId: 12, operationId: null },
    { id: 29, roleId: 2, pageId: null, moduleId: null, operationId: 4 },
    { id: 30, roleId: 2, pageId: null, moduleId: null, operationId: 5 },
    { id: 103, roleId: 22, pageId: null, moduleId: 1, operationId: null },
    { id: 104, roleId: 22, pageId: null, moduleId: 2, operationId: null },
    { id: 105, roleId: 22, pageId: null, moduleId: 5, operationId: null }
  ]
};

// Migrate sample data to database
async function migrateData(db, data) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      try {
        // Insert modules
        const moduleStmt = db.prepare('INSERT OR IGNORE INTO MODULES (ModuleID, ModuleName, ModuleCode, ApplicationType) VALUES (?, ?, ?, ?)');
        data.modules.forEach(module => {
          moduleStmt.run(module.id, module.name, module.code, module.applicationType);
        });
        moduleStmt.finalize();
        
        // Insert pages
        const pageStmt = db.prepare('INSERT OR IGNORE INTO PAGES (PageID, ModuleID, PageName, PageCode, PageURL) VALUES (?, ?, ?, ?, ?)');
        data.pages.forEach(page => {
          pageStmt.run(page.id, page.moduleId, page.name, page.code, page.url);
        });
        pageStmt.finalize();
        
        // Insert operations
        const opStmt = db.prepare('INSERT OR IGNORE INTO OPERATIONS (OperationID, PageID, OperationCode, OperationName) VALUES (?, ?, ?, ?)');
        data.operations.forEach(op => {
          opStmt.run(op.id, op.pageId, op.code, op.name);
        });
        opStmt.finalize();
        
        // Insert roles
        const roleStmt = db.prepare('INSERT OR IGNORE INTO ROLES (RoleID, RoleName, Status, IsTemplate) VALUES (?, ?, ?, ?)');
        data.roles.forEach(role => {
          roleStmt.run(role.id, role.name, role.status, role.isTemplate ? 1 : 0);
        });
        roleStmt.finalize();
        
        // Insert role permissions
        const permStmt = db.prepare('INSERT OR IGNORE INTO ROLEPERMISSIONS (RolePermissionID, RoleID, PageID, ModuleID, OperationID) VALUES (?, ?, ?, ?, ?)');
        data.rolePermissions.forEach(perm => {
          permStmt.run(perm.id, perm.roleId, perm.pageId, perm.moduleId, perm.operationId);
        });
        permStmt.finalize();
        
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          console.log('Data migration completed successfully');
          resolve();
        });
      } catch (error) {
        console.error('Error during migration:', error);
        db.run('ROLLBACK');
        reject(error);
      }
    });
  });
}

// Check if database already has data
async function checkDatabaseEmpty(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM ROLES', (err, row) => {
      if (err) {
        // If error occurs (likely because table doesn't exist yet), consider database empty
        resolve(true);
        return;
      }
      resolve(row.count === 0);
    });
  });
}

// Main migration function
async function runMigration() {
  let db = null;
  
  try {
    console.log('Starting database initialization and migration...');
    
    // Open database connection
    db = await openDatabase();
    
    // Setup database tables
    await setupDatabase(db);
    
    // Check if database is empty
    const isEmpty = await checkDatabaseEmpty(db);
    
    if (isEmpty) {
      console.log('Database is empty, migrating sample data...');
      await migrateData(db, sampleData);
      console.log('Migration completed successfully!');
    } else {
      console.log('Database already contains data, skipping migration');
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Unhandled error in migration:', error);
  process.exit(1);
});