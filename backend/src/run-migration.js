const sequelize = require('./config/database');
const migration = require('./migrations/remove-branches');

async function runMigration() {
  try {
    console.log('🔄 Running migration to remove branches...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Run the migration
    await migration.up(sequelize.getQueryInterface());
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
