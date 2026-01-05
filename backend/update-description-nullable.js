const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialect: 'postgres',
  logging: console.log
});

async function updateDescriptionColumn() {
  try {
    console.log('🔄 Starting to update description column...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Run raw SQL to alter description column
    await sequelize.query(`
      ALTER TABLE transactions
      ALTER COLUMN description DROP NOT NULL;
    `);
    
    console.log('✅ Description column updated to allow NULL');
    
    // Verify the change
    const result = await sequelize.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'description';
    `);
    
    console.log('✅ Current schema:', result[0][0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

updateDescriptionColumn();
