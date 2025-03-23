// scripts/setup-db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database file in project root
const DB_PATH = path.join(__dirname, '..', 'rolemanager.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Could not open database', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
  
  // Create tables
  db.serialize(() => {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS MODULES (
        ModuleID INTEGER PRIMARY KEY,
        ModuleName TEXT NOT NULL,
        ModuleCode TEXT NOT NULL,
        ApplicationType INTEGER NOT NULL
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS PAGES (
        PageID INTEGER PRIMARY KEY,
        ModuleID INTEGER NOT NULL,
        PageName TEXT NOT NULL,
        PageCode TEXT NOT NULL,
        PageURL TEXT,
        FOREIGN KEY (ModuleID) REFERENCES MODULES(ModuleID)
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS OPERATIONS (
        OperationID INTEGER PRIMARY KEY,
        PageID INTEGER NOT NULL,
        OperationCode TEXT NOT NULL,
        OperationName TEXT NOT NULL,
        FOREIGN KEY (PageID) REFERENCES PAGES(PageID)
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS ROLES (
        RoleID INTEGER PRIMARY KEY,
        RoleName TEXT NOT NULL UNIQUE,
        Status INTEGER NOT NULL,
        IsTemplate INTEGER DEFAULT 0
      );
    `);
    
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating tables', err);
        db.close();
        process.exit(1);
      }
      
      console.log('Database tables created successfully');
      
      // Check if data already exists
      db.get('SELECT COUNT(*) as count FROM ROLES', (err, row) => {
        if (err || row.count === 0) {
          // If error or no data, insert sample data
          insertSampleData(db);
        } else {
          console.log('Database already has data, skipping sample data insertion');
          db.close();
          console.log('Database setup completed successfully');
        }
      });
    });
  });
});

// Insert sample data
function insertSampleData(db) {
  console.log('Inserting sample data...');
  
  // Begin transaction
  db.run('BEGIN TRANSACTION');
  
  // Insert modules
  db.run("INSERT OR IGNORE INTO MODULES VALUES (1, 'Activity', '65BAA1AA-730E-4EF5-A61F-DE9D675F946C', 0)");
  db.run("INSERT OR IGNORE INTO MODULES VALUES (2, 'Goods receival', 'E6CA7A03-3C00-4453-8B6E-4D3E260EBB83', 0)");
  db.run("INSERT OR IGNORE INTO MODULES VALUES (5, 'Warehouse', '5379BADB-941A-4AB0-954D-F5F9278119E4', 0)");
  db.run("INSERT OR IGNORE INTO MODULES VALUES (12, 'System', '0000002F-0000-0000-C000-000000000046', 0)");
  
  // Insert pages
  db.run("INSERT OR IGNORE INTO PAGES VALUES (1, 1, 'Activity page', '41046929-9BAB-4C6C-AA11-CC9863F88CF6', 'Default.aspx')");
  db.run("INSERT OR IGNORE INTO PAGES VALUES (2, 1, 'User activity', '186F635D-E28F-4FA2-8792-19F86FBC81CF', 'Pages/Activity/UserActivity/UserActivitySearch.aspx')");
  db.run("INSERT OR IGNORE INTO PAGES VALUES (15, 5, 'Product', 'DCA418BF-69F3-4671-8651-F0CC7C189B5C', 'Pages/Warehouse/SearchAndListProducts.aspx')");
  db.run("INSERT OR IGNORE INTO PAGES VALUES (58, 12, 'Roles', 'D128CF43-2745-4039-9810-F11C62FBE1E2', 'Pages/System/SearchAndListRoles.aspx')");
  
  // Insert operations
  db.run("INSERT OR IGNORE INTO OPERATIONS VALUES (1, 2, '0F6C6BDC-067E-4BBD-AB7D-2002F5EC3093', 'Cancel pick list action')");
  db.run("INSERT OR IGNORE INTO OPERATIONS VALUES (2, 2, 'EA34645B-6BE0-4CAD-9A4D-3C012B14431B', 'Cancel task group action')");
  db.run("INSERT OR IGNORE INTO OPERATIONS VALUES (84, 48, 'F3D3F924-11FC-11D3-BB97-00C04F8EE6C0', 'Save')");
  
  // Insert roles
  db.run("INSERT OR IGNORE INTO ROLES VALUES (1, 'eManagerAdministrator', 0, 1)");
  db.run("INSERT OR IGNORE INTO ROLES VALUES (2, 'SuperUser', 0, 1)");
  db.run("INSERT OR IGNORE INTO ROLES VALUES (22, 'User', 0, 1)");
  
  // Insert role permissions
  db.run("INSERT OR IGNORE INTO ROLEPERMISSIONS VALUES (1, 2, NULL, 1, NULL)");
  db.run("INSERT OR IGNORE INTO ROLEPERMISSIONS VALUES (21, 2, NULL, 2, NULL)");
  db.run("INSERT OR IGNORE INTO ROLEPERMISSIONS VALUES (22, 2, NULL, 5, NULL)");
  
  // Commit transaction
  db.run('COMMIT', (err) => {
    if (err) {
      console.error('Error committing transaction:', err);
      db.run('ROLLBACK');
    } else {
      console.log('Sample data inserted successfully');
    }
    
    db.close();
    console.log('Database setup completed successfully');
  });
}