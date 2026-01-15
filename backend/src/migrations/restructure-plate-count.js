/**
 * Migration: Restructure plate_counts table
 * 
 * Mengubah struktur dari:
 *   - source (sgp/hirose/tambahan_shift1/tambahan_shift2) + plateCount
 * 
 * Menjadi:
 *   - shift (shift1/shift2/tambahan_s1/tambahan_s2) + sgpCount + hiroseCount
 * 
 * Sesuai dengan format input manual:
 * - Per tanggal per shift ada 2 input: jumlah piring SGP dan jumlah piring Hirose
 */

const sequelize = require('../config/database');

async function runMigration() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting migration: restructure plate_counts table...');
    
    // 1. Backup existing data (optional - for reference)
    console.log('Backing up existing data...');
    const [existingData] = await sequelize.query(
      'SELECT * FROM plate_counts',
      { transaction }
    );
    console.log(`Found ${existingData.length} existing records`);
    
    // 2. Drop the old table completely (data will be lost - this is a restructure)
    console.log('Dropping old table...');
    await sequelize.query('DROP TABLE IF EXISTS plate_counts CASCADE', { transaction });
    
    // 3. Create new table with new structure
    console.log('Creating new table with new structure...');
    await sequelize.query(`
      CREATE TABLE plate_counts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        shift VARCHAR(20) NOT NULL CHECK (shift IN ('shift1', 'shift2', 'tambahan_s1', 'tambahan_s2')),
        
        -- Jumlah piring per sumber
        sgp_count INTEGER NOT NULL DEFAULT 0,
        hirose_count INTEGER NOT NULL DEFAULT 0,
        
        -- Konfigurasi harga (bisa di-override per record)
        price_per_plate DECIMAL(10,2) NOT NULL DEFAULT 11500,
        income_per_plate DECIMAL(10,2) NOT NULL DEFAULT 7000,
        return_per_plate DECIMAL(10,2) NOT NULL DEFAULT 4500,
        tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.00,
        
        -- Total combined (SGP + Hirose)
        total_plates INTEGER NOT NULL DEFAULT 0,
        total_transfer DECIMAL(15,2) NOT NULL DEFAULT 0,
        
        -- SGP calculated fields
        sgp_gross_income DECIMAL(15,2) NOT NULL DEFAULT 0,
        sgp_income_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
        sgp_net_income DECIMAL(15,2) NOT NULL DEFAULT 0,
        sgp_gross_return DECIMAL(15,2) NOT NULL DEFAULT 0,
        sgp_return_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
        sgp_net_return DECIMAL(15,2) NOT NULL DEFAULT 0,
        
        -- Hirose calculated fields
        hirose_gross_income DECIMAL(15,2) NOT NULL DEFAULT 0,
        hirose_income_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
        hirose_net_income DECIMAL(15,2) NOT NULL DEFAULT 0,
        hirose_gross_return DECIMAL(15,2) NOT NULL DEFAULT 0,
        hirose_return_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
        hirose_net_return DECIMAL(15,2) NOT NULL DEFAULT 0,
        
        -- Combined totals
        total_gross_income DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_income_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_net_income DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_gross_return DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_return_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_net_return DECIMAL(15,2) NOT NULL DEFAULT 0,
        
        notes TEXT,
        user_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(date, shift)
      )
    `, { transaction });
    
    // 4. Create indexes
    console.log('Creating indexes...');
    await sequelize.query('CREATE INDEX idx_plate_counts_date ON plate_counts(date)', { transaction });
    await sequelize.query('CREATE INDEX idx_plate_counts_shift ON plate_counts(shift)', { transaction });
    await sequelize.query('CREATE INDEX idx_plate_counts_user_id ON plate_counts(user_id)', { transaction });
    
    await transaction.commit();
    console.log('Migration completed successfully!');
    console.log('');
    console.log('New structure:');
    console.log('- shift: shift1, shift2, tambahan_s1, tambahan_s2');
    console.log('- sgp_count: jumlah piring SGP');
    console.log('- hirose_count: jumlah piring Hirose');
    console.log('- Calculated fields untuk masing-masing SGP dan Hirose');
    
  } catch (error) {
    await transaction.rollback();
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigration();
