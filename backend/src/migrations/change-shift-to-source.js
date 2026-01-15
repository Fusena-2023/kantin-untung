/**
 * Migration: Change shift to source
 * 
 * Mengubah field 'shift' (siang/malam) menjadi 'source' (sgp/hirose/tambahan_shift1/tambahan_shift2)
 * 
 * Run: node src/migrations/change-shift-to-source.js
 */

const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration: Change shift to source...');
    
    // 1. Add new source column
    console.log('Adding source column...');
    await sequelize.query(`
      ALTER TABLE plate_counts 
      ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'sgp';
    `);
    
    // 2. Migrate existing data (map shift to source)
    console.log('Migrating existing data...');
    await sequelize.query(`
      UPDATE plate_counts SET source = 'sgp' WHERE shift = 'siang';
    `);
    await sequelize.query(`
      UPDATE plate_counts SET source = 'hirose' WHERE shift = 'malam';
    `);
    
    // 3. Drop old shift column and its enum type
    console.log('Dropping old shift column...');
    await sequelize.query(`
      ALTER TABLE plate_counts DROP COLUMN IF EXISTS shift;
    `);
    
    // 4. Drop old enum type if exists
    try {
      await sequelize.query(`DROP TYPE IF EXISTS "enum_plate_counts_shift";`);
    } catch (e) {
      console.log('Enum type may not exist, continuing...');
    }
    
    // 5. Update unique index
    console.log('Updating unique index...');
    await sequelize.query(`
      DROP INDEX IF EXISTS plate_counts_date_shift;
    `);
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS plate_counts_date_source 
      ON plate_counts (date, source);
    `);
    
    // 6. Create index on source
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS plate_counts_source ON plate_counts (source);
    `);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
