// scripts/migrateData.js
const { initializeDatabase } = require('../dist/services/db');
const { migrateStaticDataToDatabase } = require('../dist/services/dataMigration');

async function runMigration() {
  try {
    console.log('Starting data migration...');
    await migrateStaticDataToDatabase();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();