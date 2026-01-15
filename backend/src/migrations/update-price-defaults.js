/**
 * Migration: Update default price values
 * 
 * Old prices:
 * - pricePerPlate: 11500
 * - incomePerPlate: 7000
 * - returnPerPlate: 4500
 * 
 * New prices:
 * - pricePerPlate: 9500
 * - incomePerPlate: 7000
 * - returnPerPlate: 2500
 * 
 * Admin Transfer Bank: Rp 2.900 per minggu (dihitung di laporan)
 */

require('dotenv/config');
const sequelize = require('../config/database');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: update-price-defaults');
    
    // Update default values for price columns
    await sequelize.query(`
      ALTER TABLE plate_counts 
      ALTER COLUMN price_per_plate SET DEFAULT 9500;
    `);
    console.log('✅ Updated price_per_plate default to 9500');
    
    await sequelize.query(`
      ALTER TABLE plate_counts 
      ALTER COLUMN return_per_plate SET DEFAULT 2500;
    `);
    console.log('✅ Updated return_per_plate default to 2500');
    
    console.log('');
    console.log('📋 New price structure:');
    console.log('   - Harga per piring dari pabrik: Rp 9.500');
    console.log('   - Penghasilan kantin: Rp 7.000');
    console.log('   - Pengembalian ke pabrik: Rp 2.500');
    console.log('   - Pajak: 2%');
    console.log('   - Admin transfer bank: Rp 2.900/minggu');
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('⚠️  Note: Data yang sudah ada tetap menggunakan harga lama.');
    console.log('   Data baru akan menggunakan harga baru secara otomatis.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
